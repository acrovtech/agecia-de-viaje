import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { updatePlatformSettingsSchema } from './platform.dto.js';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgencies() {
    const agencies = await this.prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        logoUrl: true,
        iconUrl: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            tours: true,
            locales: {
              where: { enabled: true },
            },
          },
        },
      },
    });

    const agencyIds = agencies.map((a) => a.id);
    const creditAccounts = await this.prisma.aiCreditAccount.findMany({
      where: { agencyId: { in: agencyIds } },
      select: { agencyId: true, balance: true },
    });

    const balancesByAgencyId = new Map(creditAccounts.map((c) => [c.agencyId, c.balance]));

    return agencies.map((agency) => ({
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      isActive: agency.isActive,
      logoUrl: agency.logoUrl,
      iconUrl: agency.iconUrl,
      createdAt: agency.createdAt,
      membershipCount: agency._count.memberships,
      tourCount: agency._count.tours,
      enabledCatalogLocaleCount: agency._count.locales,
      aiCreditBalance: balancesByAgencyId.get(agency.id) ?? 0,
    }));
  }

  async getAgencyDetail(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        _count: {
          select: {
            memberships: true,
            tours: true,
            locales: true,
          },
        },
        locales: {
          select: {
            id: true,
            locale: true,
            isDefault: true,
            enabled: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        entitlement: true,
        brandingPreference: true,
      },
    });

    if (!agency) {
      throw new NotFoundException('Agencia no encontrada');
    }

    const [creditAccount, platformSettings] = await Promise.all([
      this.prisma.aiCreditAccount.findUnique({
        where: { agencyId },
        select: { balance: true },
      }),
      this.prisma.platformSettings.findUnique({
        where: { id: 'global' },
      }),
    ]);

    const now = new Date();
    const brandingPref = agency.brandingPreference;
    const isLocked = Boolean(brandingPref?.rewardLockedUntil && new Date(brandingPref.rewardLockedUntil) > now);
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const currentPeriod = `${year}-${month}`;

    const isCurrentPeriodClaimed = brandingPref?.lastRewardPeriod === currentPeriod;

    let currentPeriodReward: 'CLAIMED' | 'AVAILABLE' | 'DISABLED' = 'AVAILABLE';
    if (isCurrentPeriodClaimed) {
      currentPeriodReward = 'CLAIMED';
    } else if (!platformSettings?.brandingRewardEnabled) {
      currentPeriodReward = 'DISABLED';
    }

    return {
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        isActive: agency.isActive,
        logoUrl: agency.logoUrl,
        iconUrl: agency.iconUrl,
        createdAt: agency.createdAt,
      },
      counts: {
        membershipCount: agency._count.memberships,
        tourCount: agency._count.tours,
        localeCount: agency._count.locales,
        enabledCatalogLocaleCount: agency.locales.filter((l) => l.enabled).length,
      },
      locales: agency.locales,
      entitlements: agency.entitlement ? {
        maxCatalogLocales: agency.entitlement.maxCatalogLocales,
        aiEnabled: agency.entitlement.aiEnabled,
        aiMonthlyCredits: agency.entitlement.aiMonthlyCredits,
      } : {
        maxCatalogLocales: 1,
        aiEnabled: false,
        aiMonthlyCredits: 0,
      },
      aiCredits: {
        balance: creditAccount?.balance ?? 0,
      },
      coBranding: {
        platformBrandingEnabled: brandingPref?.platformBrandingEnabled ?? true,
        coBrandingGloballyEnabled: platformSettings?.coBrandingEnabled ?? true,
        effectivePlatformBranding: (platformSettings?.coBrandingEnabled ?? true) && (brandingPref?.platformBrandingEnabled ?? true),
        isLocked,
        rewardLockedUntil: brandingPref?.rewardLockedUntil ?? null,
        currentPeriodReward,
        lastRewardedPeriod: brandingPref?.lastRewardPeriod ?? null,
        rewardAmount: platformSettings?.brandingRewardCredits ?? 10,
      },
    };
  }

  async getPlatformSettings() {
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: {
          id: 'global',
          productName: 'Acrov SaaS',
          logoUrl: null,
          iconUrl: null,
          coBrandingEnabled: true,
          brandingRewardEnabled: true,
          brandingRewardCredits: 10,
        },
      });
    }

    return {
      productName: settings.productName,
      logoUrl: settings.logoUrl,
      iconUrl: settings.iconUrl,
      supportEmail: settings.supportEmail,
      coBrandingEnabled: settings.coBrandingEnabled,
      brandingRewardEnabled: settings.brandingRewardEnabled,
      brandingRewardCredits: settings.brandingRewardCredits,
      updatedAt: settings.updatedAt,
    };
  }

  async updatePlatformSettings(platformAdminId: string, rawBody: unknown) {
    const parsed = updatePlatformSettingsSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Parámetros de configuración inválidos';
      throw new BadRequestException(msg);
    }

    const { productName, logoUrl, iconUrl, coBrandingEnabled, brandingRewardEnabled, brandingRewardCredits } = parsed.data;

    const updated = await this.prisma.$transaction(async (tx) => {
      const settings = await tx.platformSettings.upsert({
        where: { id: 'global' },
        update: {
          productName,
          logoUrl: logoUrl ?? null,
          iconUrl: iconUrl ?? null,
          coBrandingEnabled,
          brandingRewardEnabled,
          brandingRewardCredits,
        },
        create: {
          id: 'global',
          productName,
          logoUrl: logoUrl ?? null,
          iconUrl: iconUrl ?? null,
          coBrandingEnabled,
          brandingRewardEnabled,
          brandingRewardCredits,
        },
      });

      await tx.platformAuditLog.create({
        data: {
          platformAdminId,
          action: 'PLATFORM_SETTINGS_UPDATE',
          entity: 'PlatformSettings',
          entityId: 'global',
          details: parsed.data,
        },
      });

      return settings;
    });

    return {
      productName: updated.productName,
      logoUrl: updated.logoUrl,
      iconUrl: updated.iconUrl,
      coBrandingEnabled: updated.coBrandingEnabled,
      brandingRewardEnabled: updated.brandingRewardEnabled,
      brandingRewardCredits: updated.brandingRewardCredits,
      updatedAt: updated.updatedAt,
    };
  }
}
