import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../database/prisma.service.js';
import { PublicRoute } from '../security/public-route.js';

export interface PublicAdminLoginContext {
  agency: {
    slug: string;
    name: string;
    logoUrl: string | null;
    iconUrl: string | null;
  };
  platformBranding: {
    enabled: boolean;
    productName: string;
    logoUrl: string | null;
    iconUrl: string | null;
  };
}

@Controller({ path: 'public/admin-login-context', version: '1' })
@ApiTags('public-admin-login-context')
export class PublicTenantLoginController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':agencySlug')
  @PublicRoute()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Obtiene el contexto seguro de marca para el inicio de sesión de un tenant.' })
  @ApiParam({ name: 'agencySlug', description: 'Slug público de la agencia' })
  @ApiOkResponse({ description: 'Contexto de marca seguro sin exponer IDs ni datos privados.' })
  async getLoginContext(@Param('agencySlug') agencySlug: string): Promise<PublicAdminLoginContext> {
    const normalizedSlug = (agencySlug || '').trim().toLowerCase();
    if (!normalizedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      throw new NotFoundException('Agencia no encontrada');
    }

    const agency = await this.prisma.agency.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        iconUrl: true,
        isActive: true,
      },
    });

    if (!agency || !agency.isActive) {
      throw new NotFoundException('Agencia no encontrada o inactiva');
    }

    const [branding, platformSettings] = await Promise.all([
      this.prisma.agencyBrandingPreference.findUnique({
        where: { agencyId: agency.id },
        select: { platformBrandingEnabled: true },
      }),
      this.prisma.platformSettings.findUnique({
        where: { id: 'global' },
        select: {
          productName: true,
          logoUrl: true,
          iconUrl: true,
        },
      }),
    ]);

    return {
      agency: {
        slug: agency.slug,
        name: agency.name,
        logoUrl: agency.logoUrl || null,
        iconUrl: agency.iconUrl || null,
      },
      platformBranding: {
        enabled: branding ? branding.platformBrandingEnabled : true,
        productName: platformSettings?.productName || 'Acrov SaaS',
        logoUrl: platformSettings?.logoUrl || null,
        iconUrl: platformSettings?.iconUrl || null,
      },
    };
  }
}
