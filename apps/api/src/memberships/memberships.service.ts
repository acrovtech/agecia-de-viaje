import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import { updateMembershipSchema, type UpdateMembershipDto } from './memberships.dto.js';
import type { AgencyMemberRole } from '@repo/db/prisma';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(identity: ApiIdentity, agencyId: string, after?: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes acceso a los miembros de esta agencia');
    }

    const rows = await this.prisma.agencyMembership.findMany({
      where: {
        agencyId,
        ...(after ? { id: { gt: after } } : {}),
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { id: 'asc' },
      take: 101,
    });

    return {
      data: rows.slice(0, 100),
      nextCursor: rows.length > 100 ? rows[99]!.id : null,
    };
  }

  async update(
    identity: ApiIdentity,
    agencyId: string,
    membershipId: string,
    rawBody: unknown
  ) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes acceso a modificar miembros de esta agencia');
    }

    const parsed = updateMembershipSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos de membresía inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException('Se debe especificar al menos un cambio (rol o estado activo)');
    }

    // Role authority checks
    if (identity.role !== 'OWNER' && identity.role !== 'ADMIN') {
      throw new ForbiddenException('Solo propietarios o administradores pueden gestionar miembros');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Find target membership within agency
      const target = await tx.agencyMembership.findFirst({
        where: {
          id: membershipId,
          agencyId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!target) {
        throw new NotFoundException('Membresía no encontrada');
      }

      // Role authority rules:
      // ADMIN cannot modify an OWNER
      if (identity.role === 'ADMIN' && target.role === 'OWNER') {
        throw new ForbiddenException('Los administradores no pueden modificar a un propietario');
      }

      // ADMIN cannot modify another ADMIN
      if (identity.role === 'ADMIN' && target.role === 'ADMIN' && target.id !== identity.membershipId) {
        throw new ForbiddenException('Los administradores no pueden modificar a otros administradores');
      }

      // ADMIN cannot self-escalate to OWNER or change own role
      if (identity.role === 'ADMIN' && target.id === identity.membershipId && dto.role && dto.role !== 'ADMIN') {
        throw new ForbiddenException('Los administradores no pueden cambiar su propio rol');
      }

      // ADMIN cannot promote anyone to OWNER or ADMIN
      if (identity.role === 'ADMIN' && dto.role && (dto.role === 'OWNER' || dto.role === 'ADMIN')) {
        throw new ForbiddenException('Solo el propietario puede asignar el rol de propietario o administrador');
      }

      // OWNER protection invariant:
      // Agency must NEVER end up without an active OWNER.
      const isTargetCurrentlyActiveOwner = target.role === 'OWNER' && target.isActive;
      const willLoseActiveOwnerStatus =
        isTargetCurrentlyActiveOwner &&
        ((dto.role !== undefined && dto.role !== 'OWNER') || dto.isActive === false);

      if (willLoseActiveOwnerStatus) {
        // Concurrency-safe check using PostgreSQL row locking
        const activeOwners = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "AgencyMembership"
          WHERE "agencyId" = ${agencyId} AND "role"::text = 'OWNER' AND "isActive" = true
          FOR UPDATE;
        `;

        if (activeOwners.length <= 1) {
          throw new ConflictException(
            'No se puede desactivar ni demote al único propietario activo de la agencia'
          );
        }
      }

      const originalRole = target.role;
      const originalIsActive = target.isActive;

      const updateData: { role?: AgencyMemberRole; isActive?: boolean } = {};
      if (dto.role !== undefined) updateData.role = dto.role as AgencyMemberRole;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const updated = await tx.agencyMembership.update({
        where: { id: target.id },
        data: updateData,
        select: {
          id: true,
          agencyId: true,
          userId: true,
          role: true,
          isActive: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Session revocation:
      // When role changes OR isActive becomes false, revoke active sessions
      const roleChanged = dto.role !== undefined && dto.role !== originalRole;
      const deactivated = dto.isActive === false && originalIsActive === true;
      const reactivated = dto.isActive === true && originalIsActive === false;

      if (roleChanged || deactivated || reactivated) {
        await tx.apiSession.updateMany({
          where: {
            membershipId: target.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      // Audit logs
      if (deactivated) {
        await tx.adminAuditLog.create({
          data: {
            userId: identity.userId,
            action: 'MEMBERSHIP_DEACTIVATED',
            entity: 'AgencyMembership',
            entityId: target.id,
            details: {
              agencyId,
              actorId: identity.userId,
              membershipId: target.id,
              targetUserId: target.userId,
              role: target.role,
            },
          },
        });
      } else if (reactivated) {
        await tx.adminAuditLog.create({
          data: {
            userId: identity.userId,
            action: 'MEMBERSHIP_REACTIVATED',
            entity: 'AgencyMembership',
            entityId: target.id,
            details: {
              agencyId,
              actorId: identity.userId,
              membershipId: target.id,
              targetUserId: target.userId,
              role: updated.role,
            },
          },
        });
      }

      if (roleChanged) {
        await tx.adminAuditLog.create({
          data: {
            userId: identity.userId,
            action: 'MEMBERSHIP_ROLE_CHANGED',
            entity: 'AgencyMembership',
            entityId: target.id,
            details: {
              agencyId,
              actorId: identity.userId,
              membershipId: target.id,
              targetUserId: target.userId,
              oldRole: target.role,
              newRole: updated.role,
            },
          },
        });
      }

      return updated;
    });
  }

  async delete(identity: ApiIdentity, agencyId: string, membershipId: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes acceso a miembros de esta agencia');
    }

    // Role check: Only OWNER can delete members
    if (identity.role !== 'OWNER') {
      throw new ForbiddenException('Solo el propietario puede eliminar miembros');
    }

    return await this.prisma.$transaction(async (tx) => {
      const target = await tx.agencyMembership.findFirst({
        where: {
          id: membershipId,
          agencyId,
        },
      });

      if (!target) {
        throw new NotFoundException('Membresía no encontrada');
      }

      // Final Owner protection
      if (target.role === 'OWNER' && target.isActive) {
        const activeOwners = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "AgencyMembership"
          WHERE "agencyId" = ${agencyId} AND "role"::text = 'OWNER' AND "isActive" = true
          FOR UPDATE;
        `;

        if (activeOwners.length <= 1) {
          throw new ConflictException(
            'No se puede eliminar al único propietario activo de la agencia'
          );
        }
      }

      // Revoke all active sessions
      await tx.apiSession.updateMany({
        where: {
          membershipId: target.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Delete the membership
      await tx.agencyMembership.delete({
        where: { id: target.id },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          action: 'MEMBERSHIP_REMOVED',
          entity: 'AgencyMembership',
          entityId: target.id,
          details: {
            agencyId,
            actorId: identity.userId,
            membershipId: target.id,
            targetUserId: target.userId,
            role: target.role,
          },
        },
      });

      return { success: true };
    });
  }
}
