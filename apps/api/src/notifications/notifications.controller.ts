import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationState } from '@repo/db/prisma';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { NotificationsService } from './notifications.service.js';

@Controller('v1/agencies/:agencyId/notifications')
@AgencyRoles('OWNER', 'ADMIN')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @Param('agencyId') agencyId: string,
    @Query('after') after?: string,
    @Query('state') state?: NotificationState,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listNotifications(agencyId, {
      after,
      state,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  async detail(
    @Param('agencyId') agencyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.getNotification(agencyId, id);
  }

  @Post(':id/retry')
  async retry(
    @Param('agencyId') agencyId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.manualRetry(req.identity, agencyId, id);
  }
}
