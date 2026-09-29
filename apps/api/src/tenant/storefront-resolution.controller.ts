import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PublicRoute } from '../security/public-route.js';
import {
  StorefrontPublicMetadata,
  StorefrontResolverService,
} from './storefront-resolver.service.js';

@Controller({ path: 'storefront-resolution', version: '1' })
@ApiTags('storefront-resolution')
export class StorefrontResolutionController {
  constructor(
    private readonly resolverService: StorefrontResolverService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  @Get()
  @PublicRoute()
  async resolve(
    @Query('host') queryHost: string | undefined,
    @Req() req: Request,
  ): Promise<StorefrontPublicMetadata> {
    let hostToResolve = queryHost;

    if (!hostToResolve) {
      if (this.config.storefrontTrustForwardedHost) {
        const forwarded = req.headers['x-forwarded-host'];
        if (typeof forwarded === 'string') {
          hostToResolve = forwarded;
        } else if (Array.isArray(forwarded) && forwarded[0]) {
          hostToResolve = forwarded[0];
        }
      }
      if (!hostToResolve) {
        hostToResolve = req.headers.host;
      }
    }

    const context = await this.resolverService.resolveFromHost(hostToResolve);
    return this.resolverService.toPublicMetadata(context);
  }
}
