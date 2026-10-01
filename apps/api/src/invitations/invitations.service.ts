import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import {
  createInvitationSchema,
  acceptInvitationSchema,
  type CreateInvitationDto,
  type AcceptInvitationDto,
} from './invitations.dto.js';
import type { AgencyMemberRole } from '@repo/db/prisma';
import { NotificationsService } from '../notifications/notifications.service.js';
import { DisabledEmailTransportAdapter } from '../notifications/transport/disabled-transport.adapter.js';

const digestToken = (rawToken: string) =>
  createHash('sha256').update(rawToken).digest('hex');

@Injectable()
export class InvitationsService {
  private readonly notifications: NotificationsService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    notificationsServiceOrAdapter?: any,
    @Optional()
    maybeNotificationsService?: NotificationsService,
  ) {
    const notifService =
      maybeNotificationsService ??
      (notificationsServiceOrAdapter?.queueNotification
        ? notificationsServiceOrAdapter
        : undefined);

    this.notifications =
      notifService ??
      new NotificationsService(
        prisma,
        {
          environment: 'test',
          databaseUrl: '',
          port: 3002,
          host: '127.0.0.1',
          corsOrigins: [],
          publicAgencySlugs: [],
          docsEnabled: false,
          rateLimit: 120,
          authEnabled: true,
          checkoutEnabled: false,
          izipaySecretKey: '',
          izipayHmacSha256: '',
          izipayShopId: '',
          izipayPassword: '',
          izipayApiUrl: '',
          izipayCurrency: 'USD',
          izipayMode: 'test',
          paymentSessionReuseDurationMs: 840000,
          mediaUploadEnabled: false,
          r2AccountId: '',
          r2AccessKeyId: '',
          r2SecretAccessKey: '',
          r2BucketName: '',
          r2PublicDomain: '',
          storefrontBaseDomain: 'platform.example',
          storefrontTrustForwardedHost: false,
          emailDeliveryEnabled: false,
          notificationPayloadKey: createHash('sha256').update('dev-test-notification-payload-key-32b').digest(),
          emailFromAddress: 'noreply@travelagency.pe',
          emailFromName: 'Travel Agency',
          adminPublicOrigin: 'http://localhost:3001',
        },
        new DisabledEmailTransportAdapter(),
      );
  }

  async createInvitation(
    identity: ApiIdentity,
    agencyId: string,
    rawBody: unknown
  ) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para invitar miembros a esta agencia');
    }

    if (identity.role !== 'OWNER' && identity.role !== 'ADMIN') {
      throw new ForbiddenException('Solo propietarios o administradores pueden invitar miembros');
    }

    const parsed = createInvitationSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos de invitación inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    // Role authority checks
    if (identity.role === 'ADMIN') {
      if (dto.role === 'ADMIN') {
        throw new ForbiddenException('Los administradores no pueden invitar a otros administradores');
      }
      if (dto.role !== 'EDITOR' && dto.role !== 'OPERATOR' && dto.role !== 'VIEWER') {
        throw new ForbiddenException('Rol no autorizado para invitación por administradores');
      }
    }

    // Check if user already has an active membership in this agency
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      const activeMembership = await this.prisma.agencyMembership.findUnique({
        where: {
          agencyId_userId: {
            agencyId,
            userId: existingUser.id,
          },
        },
      });

      if (activeMembership && activeMembership.isActive) {
        throw new ConflictException('El usuario ya cuenta con una membresía activa en esta agencia');
      }
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, isActive: true },
    });

    if (!agency || !agency.isActive) {
      throw new BadRequestException('Agencia no disponible');
    }

    // Generate cryptographically secure token (32 random bytes -> 64 hex chars)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = digestToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.$transaction(async (tx) => {
      // Upsert: exactly one invitation row per (agencyId, email)
      const inv = await tx.agencyInvitation.upsert({
        where: {
          agencyId_email: {
            agencyId,
            email: dto.email,
          },
        },
        create: {
          agencyId,
          email: dto.email,
          role: dto.role as AgencyMemberRole,
          tokenHash,
          expiresAt,
          invitedById: identity.userId,
        },
        update: {
          role: dto.role as AgencyMemberRole,
          tokenHash,
          expiresAt,
          acceptedAt: null,
          revokedAt: null,
          invitedById: identity.userId,
        },
        select: {
          id: true,
          agencyId: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log (never log raw token or tokenHash)
      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          action: 'MEMBERSHIP_INVITED',
          entity: 'AgencyInvitation',
          entityId: inv.id,
          details: {
            agencyId,
            actorId: identity.userId,
            email: dto.email,
            role: dto.role,
          },
        },
      });

      // Atomically queue encrypted transactional notification (SINGLE delivery path)
      const idempotencyKey = `invitation:${inv.id}:${tokenHash.slice(0, 16)}`;
      await this.notifications.queueNotification(tx, {
        agencyId,
        kind: 'MEMBERSHIP_INVITATION',
        audience: 'INTERNAL',
        recipient: dto.email,
        subject: `Invitación para unirte al equipo de ${agency.name}`,
        idempotencyKey,
        payload: {
          rawToken,
          invitationId: inv.id,
          role: dto.role,
          agencyName: agency.name,
          expiresAt: expiresAt.toISOString(),
        },
      });

      return inv;
    });

    // BLOCKER 5: The transactional outbox is the SINGLE authoritative delivery path.
    // No synchronous deliveryAdapter.sendInvitation() call. The queued notification
    // will be processed by the outbox worker when email delivery is enabled.

    const isNonProdOrTest =
      process.env.NODE_ENV !== 'production' ||
      process.env.API_TEST_MODE === 'true' ||
      Boolean(process.env.VITEST);

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      notificationState: 'PENDING' as const,
      ...(isNonProdOrTest ? { _devRawToken: rawToken } : {}),
    };
  }

  async listInvitations(identity: ApiIdentity, agencyId: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para ver invitaciones de esta agencia');
    }

    const invitations = await this.prisma.agencyInvitation.findMany({
      where: { agencyId },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: invitations };
  }

  async revokeInvitation(
    identity: ApiIdentity,
    agencyId: string,
    invitationId: string
  ) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para revocar invitaciones de esta agencia');
    }

    const invitation = await this.prisma.agencyInvitation.findFirst({
      where: { id: invitationId, agencyId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (identity.role === 'ADMIN' && invitation.role === 'ADMIN') {
      throw new ForbiddenException('Los administradores no pueden revocar invitaciones de administradores');
    }

    if (invitation.revokedAt) {
      return { success: true, message: 'La invitación ya estaba revocada' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.agencyInvitation.update({
        where: { id: invitation.id },
        data: { revokedAt: new Date() },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          action: 'INVITATION_REVOKED',
          entity: 'AgencyInvitation',
          entityId: invitation.id,
          details: {
            agencyId,
            actorId: identity.userId,
            invitationId: invitation.id,
            email: invitation.email,
            role: invitation.role,
          },
        },
      });
    });

    return { success: true, message: 'Invitación revocada exitosamente' };
  }

  async getPublicInvitation(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new NotFoundException('Token de invitación no válido');
    }

    const tokenHash = digestToken(rawToken);

    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { tokenHash },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('Esta invitación ha sido revocada');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Esta invitación ya ha sido aceptada');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Esta invitación ha expirado');
    }

    if (!invitation.agency.isActive) {
      throw new BadRequestException('La agencia se encuentra inactiva');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });

    return {
      agencyName: invitation.agency.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      isExistingUser: Boolean(existingUser),
    };
  }

  async acceptInvitation(rawToken: string, rawBody: unknown) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new NotFoundException('Token de invitación no válido');
    }

    const parsed = acceptInvitationSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos de aceptación inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    const tokenHash = digestToken(rawToken);

    return await this.prisma.$transaction(async (tx) => {
      // Postgres row lock on invitation
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          agencyId: string;
          email: string;
          role: AgencyMemberRole;
          expiresAt: Date;
          acceptedAt: Date | null;
          revokedAt: Date | null;
        }>
      >`
        SELECT id, "agencyId", email, role, "expiresAt", "acceptedAt", "revokedAt"
        FROM "AgencyInvitation"
        WHERE "tokenHash" = ${tokenHash}
        FOR UPDATE;
      `;

      const inv = rows[0];
      if (!inv) {
        throw new NotFoundException('Invitación no encontrada');
      }

      if (inv.revokedAt) {
        throw new BadRequestException('Esta invitación ha sido revocada');
      }

      if (inv.acceptedAt) {
        throw new ConflictException('Esta invitación ya ha sido aceptada');
      }

      if (new Date(inv.expiresAt) < new Date()) {
        throw new BadRequestException('Esta invitación ha expirado');
      }

      const existingUser = await tx.user.findUnique({
        where: { email: inv.email },
      });

      if (!existingUser) {
        // Scenario 1: New User
        // Bcrypt cost 10
        const passwordHash = await hash(dto.password, 10);
        const userName = dto.name?.trim() || inv.email.split('@')[0]!;

        const newUser = await tx.user.create({
          data: {
            email: inv.email,
            name: userName,
            password: passwordHash,
            role: 'OPERATOR',
            isActive: true,
          },
        });

        const membership = await tx.agencyMembership.create({
          data: {
            agencyId: inv.agencyId,
            userId: newUser.id,
            role: inv.role,
            isActive: true,
          },
        });

        await tx.agencyInvitation.update({
          where: { id: inv.id },
          data: { acceptedAt: new Date() },
        });

        await tx.adminAuditLog.create({
          data: {
            userId: newUser.id,
            action: 'INVITATION_ACCEPTED',
            entity: 'AgencyInvitation',
            entityId: inv.id,
            details: {
              agencyId: inv.agencyId,
              userId: newUser.id,
              membershipId: membership.id,
              role: inv.role,
              isNewUser: true,
            },
          },
        });

        return {
          success: true,
          message: 'Cuenta creada y membresía activada exitosamente',
        };
      } else {
        // Scenario 2: Existing User
        // Never overwrite password! Verify control using existing password.
        const isPasswordValid = await compare(dto.password, existingUser.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Contraseña incorrecta');
        }

        const existingMembership = await tx.agencyMembership.findUnique({
          where: {
            agencyId_userId: {
              agencyId: inv.agencyId,
              userId: existingUser.id,
            },
          },
        });

        let membershipId: string;

        if (existingMembership) {
          if (existingMembership.isActive) {
            throw new ConflictException('El usuario ya cuenta con una membresía activa en esta agencia');
          }

          // Reactivate inactive membership
          const reactivated = await tx.agencyMembership.update({
            where: { id: existingMembership.id },
            data: {
              role: inv.role,
              isActive: true,
            },
          });
          membershipId = reactivated.id;

          // Revoke old sessions
          await tx.apiSession.updateMany({
            where: {
              membershipId: reactivated.id,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(),
            },
          });

          await tx.adminAuditLog.create({
            data: {
              userId: existingUser.id,
              action: 'MEMBERSHIP_REACTIVATED',
              entity: 'AgencyMembership',
              entityId: reactivated.id,
              details: {
                agencyId: inv.agencyId,
                actorId: existingUser.id,
                membershipId: reactivated.id,
                targetUserId: existingUser.id,
                role: inv.role,
              },
            },
          });
        } else {
          // Create new membership
          const created = await tx.agencyMembership.create({
            data: {
              agencyId: inv.agencyId,
              userId: existingUser.id,
              role: inv.role,
              isActive: true,
            },
          });
          membershipId = created.id;
        }

        await tx.agencyInvitation.update({
          where: { id: inv.id },
          data: { acceptedAt: new Date() },
        });

        await tx.adminAuditLog.create({
          data: {
            userId: existingUser.id,
            action: 'INVITATION_ACCEPTED',
            entity: 'AgencyInvitation',
            entityId: inv.id,
            details: {
              agencyId: inv.agencyId,
              userId: existingUser.id,
              membershipId,
              role: inv.role,
              isNewUser: false,
            },
          },
        });

        return {
          success: true,
          message: 'Membresía activada exitosamente',
        };
      }
    });
  }
}
