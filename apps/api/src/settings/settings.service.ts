import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import {
  updateAgencyProfileSchema,
  updateLegalProfileSchema,
  type UpdateAgencyProfileDto,
  type UpdateLegalProfileDto,
} from './settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        phone: true,
        email: true,
        address: true,
        logoUrl: true,
        iconUrl: true,
        updatedAt: true,
      },
    });

    if (!agency) {
      throw new NotFoundException('Agencia no encontrada');
    }

    return agency;
  }

  async updateProfile(
    identity: ApiIdentity,
    agencyId: string,
    rawBody: unknown
  ) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar la configuración de esta agencia');
    }

    const parsed = updateAgencyProfileSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos de perfil inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Authoritative row lock on Agency inside PostgreSQL transaction
      const lockedRows = await tx.$queryRaw<Array<{ id: string; updatedAt: Date }>>`
        SELECT id, "updatedAt"
        FROM "Agency"
        WHERE id = ${agencyId}
        FOR UPDATE;
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new NotFoundException('Agencia no encontrada');
      }

      const currentAgency = await tx.agency.findUnique({
        where: { id: agencyId },
      });

      if (!currentAgency) {
        throw new NotFoundException('Agencia no encontrada');
      }

      // 2. Transactional optimistic concurrency check
      const currentIso = currentAgency.updatedAt.toISOString();
      if (currentIso !== dto.expectedUpdatedAt) {
        throw new ConflictException(
          'El perfil de la agencia fue modificado por otro usuario (actualización desactualizada)'
        );
      }

      // 3. Validate media URLs
      await this.validateMediaUrl(dto.logoUrl, identity.agencyId, tx);
      await this.validateMediaUrl(dto.iconUrl, identity.agencyId, tx);

      const before = {
        name: currentAgency.name,
        phone: currentAgency.phone,
        email: currentAgency.email,
        address: currentAgency.address,
        logoUrl: currentAgency.logoUrl,
        iconUrl: currentAgency.iconUrl,
      };

      const updateData = {
        name: dto.name,
        phone: dto.phone !== undefined ? (dto.phone || null) : currentAgency.phone,
        email: dto.email !== undefined ? (dto.email || null) : currentAgency.email,
        address: dto.address !== undefined ? (dto.address || null) : currentAgency.address,
        logoUrl: dto.logoUrl !== undefined ? (dto.logoUrl || null) : currentAgency.logoUrl,
        iconUrl: dto.iconUrl !== undefined ? (dto.iconUrl || null) : currentAgency.iconUrl,
      };

      const after = { ...updateData };

      const agencyRecord = await tx.agency.update({
        where: { id: agencyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          customDomain: true,
          phone: true,
          email: true,
          address: true,
          logoUrl: true,
          iconUrl: true,
          updatedAt: true,
        },
      });

      await tx.configurationAudit.create({
        data: {
          agencyId,
          actorId: identity.userId,
          target: 'AGENCY_PROFILE',
          before,
          after,
        },
      });

      return agencyRecord;
    });
  }

  async getLegalProfile(agencyId: string) {
    const legalProfile = await this.prisma.legalProfile.findUnique({
      where: { agencyId },
    });

    const data = (legalProfile?.data as Record<string, any>) || {};

    return {
      ruc: data.ruc || '',
      legalName: data.legalName || '',
      tradeName: data.tradeName || '',
      fiscalAddress: data.fiscalAddress || '',
      legalRepresentative: data.legalRepresentative || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      updatedAt: legalProfile?.updatedAt ? legalProfile.updatedAt.toISOString() : null,
    };
  }

  async updateLegalProfile(
    identity: ApiIdentity,
    agencyId: string,
    rawBody: unknown
  ) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar el perfil legal de esta agencia');
    }

    const parsed = updateLegalProfileSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos del perfil legal inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Authoritative row lock on Agency row inside PostgreSQL transaction
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Agency"
        WHERE id = ${agencyId}
        FOR UPDATE;
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new NotFoundException('Agencia no encontrada');
      }

      // 2. Load current LegalProfile inside the same transaction
      const existing = await tx.legalProfile.findUnique({
        where: { agencyId },
      });

      // 3. Concurrency check: initial creation vs update
      if (dto.expectedUpdatedAt === null) {
        if (existing) {
          throw new ConflictException(
            'El perfil legal ya fue creado por otro usuario (actualización desactualizada)'
          );
        }
      } else {
        if (!existing || existing.updatedAt.toISOString() !== dto.expectedUpdatedAt) {
          throw new ConflictException(
            'El perfil legal fue modificado por otro usuario (actualización desactualizada)'
          );
        }
      }

      const before = (existing?.data as Record<string, any>) || {};
      const after = {
        ruc: dto.ruc,
        legalName: dto.legalName,
        tradeName: dto.tradeName || null,
        fiscalAddress: dto.fiscalAddress,
        legalRepresentative: dto.legalRepresentative || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
      };

      const record = await tx.legalProfile.upsert({
        where: { agencyId },
        create: {
          agencyId,
          data: after,
        },
        update: {
          data: after,
        },
      });

      await tx.configurationAudit.create({
        data: {
          agencyId,
          actorId: identity.userId,
          target: 'LEGAL_PROFILE',
          before,
          after,
        },
      });

      return {
        ...after,
        updatedAt: record.updatedAt.toISOString(),
      };
    });
  }

  private async validateMediaUrl(
    url: string | null | undefined,
    agencyId: string,
    db: any = this.prisma
  ) {
    if (!url) return;

    // 1. Path-based check: agencies/{foreignAgencyId}/...
    const match = url.match(/agencies\/([^/]+)\//);
    if (match && match[1] && match[1] !== agencyId) {
      throw new ForbiddenException('No puedes utilizar archivos multimedia de otra agencia');
    }

    // 2. Database lookup check: if asset exists in MediaAsset, ensure tenant matches
    const asset = await db.mediaAsset.findFirst({
      where: {
        OR: [{ publicUrl: url }, { objectKey: url }],
      },
      select: { agencyId: true },
    });

    if (asset && asset.agencyId !== agencyId) {
      throw new ForbiddenException('No puedes utilizar archivos multimedia pertenecientes a otra agencia');
    }
  }
}
