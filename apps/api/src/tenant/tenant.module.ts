import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { TenantInterceptor } from './tenant.interceptor.js';
import { TenantService } from './tenant.service.js';

@Global()
@Module({
  providers: [PrismaService, TenantService, TenantInterceptor],
  exports: [TenantService, TenantInterceptor],
})
export class TenantModule {}
