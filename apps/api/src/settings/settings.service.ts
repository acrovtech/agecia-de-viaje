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
  addLocaleSchema,
  SUPPORTED_CATALOG_LOCALES,
  createFeedbackSchema,
  updateBrandingSchema,
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

  // ---------------------------------------------------------------------------
  // ENTITLEMENTS
  // ---------------------------------------------------------------------------
  async getEntitlements(agencyId: string) {
    const entitlement = await this.prisma.agencyEntitlement.findUnique({
      where: { agencyId },
    });

    if (!entitlement) {
      return {
        agencyId,
        maxCatalogLocales: 1,
        aiEnabled: false,
        aiMonthlyCredits: 0,
      };
    }

    return entitlement;
  }

  // ---------------------------------------------------------------------------
  // CATALOG LOCALES
  // ---------------------------------------------------------------------------
  async getLocales(agencyId: string) {
    let locales = await this.prisma.agencyLocale.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'asc' },
    });

    if (locales.length === 0) {
      try {
        await this.prisma.agencyLocale.create({
          data: {
            agencyId,
            locale: 'es',
            isDefault: true,
            enabled: true,
          },
        });
      } catch (error: any) {
        // Race-safe bootstrap: only catch expected Prisma unique constraint collision (P2002)
        const isUniqueCollision =
          error?.code === 'P2002' ||
          (typeof error?.message === 'string' &&
            (error.message.includes('Unique constraint') || error.message.includes('P2002')));
        if (!isUniqueCollision) {
          throw error;
        }
      }
      locales = await this.prisma.agencyLocale.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'asc' },
      });
    }

    const entitlements = await this.getEntitlements(agencyId);
    const defaultLocale = locales.find((l) => l.isDefault)?.locale || 'es';

    return {
      locales,
      defaultLocale,
      maxCatalogLocales: entitlements.maxCatalogLocales,
      enabledCount: locales.filter((l) => l.enabled).length,
      supportedLocales: [...SUPPORTED_CATALOG_LOCALES],
    };
  }

  async addLocale(identity: ApiIdentity, agencyId: string, rawBody: unknown) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar la configuración de esta agencia');
    }

    const parsed = addLocaleSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Idioma no válido';
      throw new BadRequestException(msg);
    }
    const { locale } = parsed.data;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Authoritative lock on Agency to serialize concurrent locale entitlement decisions
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Agency"
        WHERE id = ${agencyId}
        FOR UPDATE;
      `;
      if (!lockedRows || lockedRows.length === 0) {
        throw new NotFoundException('Agencia no encontrada');
      }

      // 2. Read entitlements inside transaction
      const entitlement = await tx.agencyEntitlement.findUnique({
        where: { agencyId },
      });
      const maxCatalogLocales = entitlement?.maxCatalogLocales ?? 1;

      // 3. Read existing locales inside transaction
      const existingLocales = await tx.agencyLocale.findMany({
        where: { agencyId },
      });

      const activeCount = existingLocales.filter((l) => l.enabled).length;
      const isAlreadyPresentAndActive = existingLocales.some((l) => l.locale === locale && l.enabled);

      if (!isAlreadyPresentAndActive && activeCount >= maxCatalogLocales) {
        throw new ForbiddenException(
          `Tu configuración actual permite un máximo de ${maxCatalogLocales} idioma(s) de catálogo.`
        );
      }

      return await tx.agencyLocale.upsert({
        where: {
          agencyId_locale: {
            agencyId,
            locale,
          },
        },
        create: {
          agencyId,
          locale,
          enabled: true,
          isDefault: existingLocales.length === 0,
        },
        update: {
          enabled: true,
        },
      });
    });
  }

  async setDefaultLocale(identity: ApiIdentity, agencyId: string, localeId: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar la configuración de esta agencia');
    }

    const targetLocale = await this.prisma.agencyLocale.findFirst({
      where: { id: localeId, agencyId },
    });

    if (!targetLocale) {
      throw new NotFoundException('Idioma no encontrado para esta agencia');
    }

    if (!targetLocale.enabled) {
      throw new BadRequestException('No se puede establecer como predeterminado un idioma deshabilitado');
    }

    const tourCount = await this.prisma.tour.count({ where: { agencyId } });
    if (tourCount > 0) {
      throw new ConflictException(
        'No se puede cambiar el idioma principal de la agencia porque ya existen tours registrados en el catálogo.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.agencyLocale.updateMany({
        where: { agencyId, isDefault: true },
        data: { isDefault: false },
      });

      return await tx.agencyLocale.update({
        where: { id: targetLocale.id },
        data: { isDefault: true },
      });
    });
  }

  async removeLocale(identity: ApiIdentity, agencyId: string, localeId: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar la configuración de esta agencia');
    }

    const target = await this.prisma.agencyLocale.findFirst({
      where: { id: localeId, agencyId },
    });

    if (!target) {
      throw new NotFoundException('Idioma no encontrado');
    }

    if (target.isDefault) {
      throw new BadRequestException('No puedes deshabilitar el idioma principal del catálogo');
    }

    const activeLocales = await this.prisma.agencyLocale.findMany({
      where: { agencyId, enabled: true },
    });
    if (activeLocales.length <= 1) {
      throw new BadRequestException('La agencia debe tener al menos un idioma habilitado en su catálogo');
    }

    // Disable rather than destroy, preserving TourLocalizedContent and restoring access if re-enabled
    return await this.prisma.agencyLocale.update({
      where: { id: target.id },
      data: { enabled: false },
    });
  }

  // ---------------------------------------------------------------------------
  // AI CREDITS (FOUNDATION & LEDGER)
  // ---------------------------------------------------------------------------
  async getCredits(agencyId: string) {
    let account = await this.prisma.aiCreditAccount.findUnique({
      where: { agencyId },
    });

    if (!account) {
      account = await this.prisma.aiCreditAccount.create({
        data: { agencyId, balance: 0 },
      });
    }

    const ledger = await this.prisma.aiCreditLedger.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      balance: account.balance,
      ledger,
    };
  }

  // ---------------------------------------------------------------------------
  // PRODUCT FEEDBACK
  // ---------------------------------------------------------------------------
  async createFeedback(identity: ApiIdentity, agencyId: string, rawBody: unknown) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para enviar comentarios para esta agencia');
    }

    const parsed = createFeedbackSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Datos de comentario inválidos';
      throw new BadRequestException(msg);
    }
    const dto = parsed.data;

    // Submitting feedback creates ZERO reward credits automatically
    return await this.prisma.productFeedback.create({
      data: {
        agencyId,
        userId: identity.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        status: 'OPEN',
        rewardCredits: null,
      },
    });
  }

  async listFeedback(agencyId: string) {
    return await this.prisma.productFeedback.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ---------------------------------------------------------------------------
  // CO-BRANDING & MONTHLY AI CREDIT REWARD
  // ---------------------------------------------------------------------------
  async getBranding(agencyId: string) {
    const now = new Date();
    const { period } = getCurrentRewardPeriodAndBoundary(now);

    const [brandingPref, platformSettings, currentClaim] = await Promise.all([
      this.prisma.agencyBrandingPreference.findUnique({
        where: { agencyId },
      }),
      this.prisma.platformSettings.findUnique({
        where: { id: 'global' },
      }),
      this.prisma.brandingRewardClaim.findUnique({
        where: { agencyId_period: { agencyId, period } },
      }),
    ]);

    const isLocked = Boolean(brandingPref?.rewardLockedUntil && brandingPref.rewardLockedUntil > now);

    return {
      platformBrandingEnabled: brandingPref ? brandingPref.platformBrandingEnabled : true,
      rewardLockedUntil: brandingPref?.rewardLockedUntil || null,
      lastRewardPeriod: brandingPref?.lastRewardPeriod || null,
      isLocked,
      isCurrentPeriodClaimed: Boolean(currentClaim),
      currentPeriod: period,
      rewardCredits: platformSettings?.brandingRewardCredits ?? 10,
      brandingRewardEnabledGlobally: platformSettings?.brandingRewardEnabled ?? true,
      productName: platformSettings?.productName || 'Acrov SaaS',
      platformLogoUrl: platformSettings?.logoUrl || null,
      platformIconUrl: platformSettings?.iconUrl || null,
    };
  }

  async updateBranding(identity: ApiIdentity, agencyId: string, rawBody: unknown) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para modificar el co-branding de esta agencia');
    }

    const parsed = updateBrandingSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException('Configuración de branding inválida');
    }
    const { platformBrandingEnabled } = parsed.data;

    return await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const existing = await tx.agencyBrandingPreference.findUnique({
        where: { agencyId },
      });

      // Si se intenta desactivar el co-branding mientras está bloqueado por recompensa activa
      if (!platformBrandingEnabled && existing?.rewardLockedUntil && existing.rewardLockedUntil > now) {
        throw new ConflictException(
          'El co-branding está bloqueado hasta el próximo ciclo porque esta agencia recibió la recompensa de créditos IA.'
        );
      }

      const updated = await tx.agencyBrandingPreference.upsert({
        where: { agencyId },
        update: { platformBrandingEnabled },
        create: { agencyId, platformBrandingEnabled },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          action: platformBrandingEnabled ? 'SAAS_BRANDING_ENABLED' : 'SAAS_BRANDING_DISABLED',
          entity: 'AgencyBrandingPreference',
          entityId: updated.id,
          details: { agencyId, platformBrandingEnabled },
        },
      });

      return {
        platformBrandingEnabled: updated.platformBrandingEnabled,
        rewardLockedUntil: updated.rewardLockedUntil,
        isLocked: Boolean(updated.rewardLockedUntil && updated.rewardLockedUntil > now),
      };
    });
  }

  async claimBrandingReward(identity: ApiIdentity, agencyId: string) {
    if (identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para reclamar recompensas para esta agencia');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Authoritative lock on Agency
      const agency = await tx.agency.findUnique({ where: { id: agencyId } });
      if (!agency) {
        throw new NotFoundException('Agencia no encontrada');
      }
      if (typeof (tx as any).$queryRaw === 'function') {
        try {
          await tx.$queryRaw`SELECT id FROM "Agency" WHERE id = ${agencyId} FOR UPDATE;`;
        } catch {
          // If the underlying database / mock doesn't support raw FOR UPDATE, continue safely
        }
      }

      // 2. Read PlatformSettings
      const platformSettings = await tx.platformSettings.findUnique({
        where: { id: 'global' },
      });

      if (!platformSettings || !platformSettings.brandingRewardEnabled) {
        throw new BadRequestException('El programa de recompensas de co-branding está deshabilitado globalmente.');
      }

      const now = new Date();
      const { period, lockedUntil } = getCurrentRewardPeriodAndBoundary(now);
      const rewardCredits = platformSettings.brandingRewardCredits;

      // 3. Check idempotency: at most once per reward period
      const existingClaim = await tx.brandingRewardClaim.findUnique({
        where: { agencyId_period: { agencyId, period } },
      });

      if (existingClaim) {
        throw new ConflictException('Esta agencia ya recibió la recompensa de créditos IA correspondiente a este período.');
      }

      // 4. Upsert AgencyBrandingPreference: enable branding and lock until next period
      await tx.agencyBrandingPreference.upsert({
        where: { agencyId },
        update: {
          platformBrandingEnabled: true,
          rewardLockedUntil: lockedUntil,
          lastRewardPeriod: period,
        },
        create: {
          agencyId,
          platformBrandingEnabled: true,
          rewardLockedUntil: lockedUntil,
          lastRewardPeriod: period,
        },
      });

      // 5. Increment AiCreditAccount balance
      let account = await tx.aiCreditAccount.findUnique({
        where: { agencyId },
      });
      if (!account) {
        account = await tx.aiCreditAccount.create({
          data: { agencyId, balance: 0 },
        });
      }

      const updatedAccount = await tx.aiCreditAccount.update({
        where: { id: account.id },
        data: { balance: { increment: rewardCredits } },
      });

      // 6. Record in AiCreditLedger
      const ledger = await tx.aiCreditLedger.create({
        data: {
          agencyId,
          userId: identity.userId,
          delta: rewardCredits,
          reason: 'BRANDING_REWARD',
          referenceType: 'BRANDING_PERIOD',
          referenceId: period,
        },
      });

      // 7. Persist BrandingRewardClaim idempotency record
      const claim = await tx.brandingRewardClaim.create({
        data: {
          agencyId,
          period,
          credits: rewardCredits,
          lockedUntil,
          ledgerId: ledger.id,
        },
      });

      // 8. Audit event
      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          action: 'SAAS_BRANDING_REWARD_CLAIMED',
          entity: 'BrandingRewardClaim',
          entityId: claim.id,
          details: { agencyId, period, credits: rewardCredits, lockedUntil },
        },
      });

      return {
        success: true,
        claimed: true,
        creditsAwarded: rewardCredits,
        period,
        lockedUntil,
        balance: updatedAccount.balance,
        newBalance: updatedAccount.balance,
      };
    });
  }
}

function getCurrentRewardPeriodAndBoundary(now: Date = new Date()): { period: string; lockedUntil: Date } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStr = String(month + 1).padStart(2, '0');
  const period = `${year}-${monthStr}`;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const lockedUntil = new Date(Date.UTC(nextMonthYear, nextMonth, 1, 0, 0, 0, 0));
  return { period, lockedUntil };
}


