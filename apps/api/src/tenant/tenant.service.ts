import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import { TenantContext } from './tenant.types.js';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  async resolve(storefront: string): Promise<TenantContext> {
    // Explicit publication gate until StorefrontChannel is migrated to the schema.
    if (!this.config.publicAgencySlugs.includes(storefront)) {
      throw new NotFoundException();
    }

    const agency = await this.prisma.agency.findFirst({
      where: { slug: storefront, isActive: true },
      select: { id: true, slug: true, name: true, isActive: true },
    });

    if (!agency) {
      throw new NotFoundException();
    }

    return Object.freeze({
      agencyId: agency.id,
      slug: agency.slug,
      name: agency.name,
      isActive: agency.isActive,
    });
  }
}
