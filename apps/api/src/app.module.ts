import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { API_CONFIG, ApiConfig } from './config.js';
import { PrismaService } from './database/prisma.service.js';
import { HealthController } from './health/health.controller.js';
import { AccessGuard } from './security/public-route.js';
import { CatalogService } from './catalog/catalog.service.js';
import { CatalogController } from './catalog/catalog.controller.js';
import { TenantService } from './tenant/tenant.service.js';
import { TenantInterceptor } from './tenant/tenant.interceptor.js';
import { CheckoutController } from './checkout/checkout.controller.js';
import { CheckoutService } from './checkout/checkout.service.js';
import { PaymentsController } from './payments/payments.controller.js';
import { PaymentsService } from './payments/payments.service.js';
import { AuthService } from './auth/auth.service.js';
import { AuthController } from './auth/auth.controller.js';
import { MembershipsController } from './auth/memberships.controller.js';
import { MembershipsService } from './memberships/memberships.service.js';
import { AdminCatalogController } from './catalog/admin-catalog.controller.js';
import { CatalogWriteService } from './catalog/catalog-write.service.js';
import { CatalogContentService } from './catalog/catalog-content.service.js';
import { CatalogContentController } from './catalog/catalog-content.controller.js';
import { ReservationsService } from './reservations/reservations.service.js';
import { ReservationsController } from './reservations/reservations.controller.js';
import { MediaController } from './media/media.controller.js';
import { MediaService } from './media/media.service.js';
import { R2StorageAdapter } from './media/storage/r2-storage.adapter.js';
import { STORAGE_ADAPTER } from './media/storage/storage-adapter.interface.js';
import { SettingsController } from './settings/settings.controller.js';
import { SettingsService } from './settings/settings.service.js';
import { InvitationsController } from './invitations/invitations.controller.js';
import { PublicInvitationsController } from './invitations/public-invitations.controller.js';
import { InvitationsService } from './invitations/invitations.service.js';
import {
  DefaultInvitationDeliveryAdapter,
  INVITATION_DELIVERY_ADAPTER,
} from './invitations/invitation-delivery.adapter.js';

@Module({})
export class AppModule {
  static register(config: ApiConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: config.rateLimit }])],
      controllers: [
        HealthController,
        CatalogController,
        ...(config.authEnabled
          ? [
              AuthController,
              MembershipsController,
              SettingsController,
              InvitationsController,
              PublicInvitationsController,
              AdminCatalogController,
              CatalogContentController,
              ReservationsController,
              MediaController,
            ]
          : []),
        // Financial endpoints are enabled when checkout is activated and validated.
        ...(config.checkoutEnabled ? [CheckoutController, PaymentsController] : []),
      ],
      providers: [
        { provide: API_CONFIG, useValue: config },
        PrismaService,
        AuthService,
        TenantService,
        CatalogService,
        CatalogWriteService,
        CatalogContentService,
        ReservationsService,
        CheckoutService,
        PaymentsService,
        MediaService,
        R2StorageAdapter,
        { provide: STORAGE_ADAPTER, useExisting: R2StorageAdapter },
        SettingsService,
        MembershipsService,
        InvitationsService,
        DefaultInvitationDeliveryAdapter,
        {
          provide: INVITATION_DELIVERY_ADAPTER,
          useExisting: DefaultInvitationDeliveryAdapter,
        },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AccessGuard },
        { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
      ],
    };
  }
}
