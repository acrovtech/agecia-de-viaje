import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicRoute } from '../security/public-route.js';
import { InvitationsService } from './invitations.service.js';

@Controller({ path: 'invitations', version: '1' })
@ApiTags('invitations-public')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  @PublicRoute()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getPublic(@Param('token') token: string) {
    return this.invitationsService.getPublicInvitation(token);
  }

  @Post(':token/accept')
  @PublicRoute()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async accept(@Param('token') token: string, @Body() body: unknown) {
    return this.invitationsService.acceptInvitation(token, body);
  }
}
