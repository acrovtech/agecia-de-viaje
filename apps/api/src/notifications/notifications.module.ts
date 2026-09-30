import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { EMAIL_TRANSPORT_ADAPTER } from './transport/email-transport.interface.js';
import { DisabledEmailTransportAdapter } from './transport/disabled-transport.adapter.js';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationsService,
    {
      provide: EMAIL_TRANSPORT_ADAPTER,
      useClass: DisabledEmailTransportAdapter,
    },
  ],
  exports: [NotificationsService, EMAIL_TRANSPORT_ADAPTER],
})
export class NotificationsModule {}
