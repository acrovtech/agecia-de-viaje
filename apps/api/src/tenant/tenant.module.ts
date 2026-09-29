import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { StorefrontResolverService } from './storefront-resolver.service.js';
import { TenantInterceptor } from './tenant.interceptor.js';
import { TenantService } from './tenant.service.js';

@Global()
@Module({
  providers: [PrismaService, TenantService, StorefrontResolverService, TenantInterceptor],
  exports: [TenantService, StorefrontResolverService, TenantInterceptor],
})
export class TenantModule {}
