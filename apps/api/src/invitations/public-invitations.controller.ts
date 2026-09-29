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
import { PublicRoute } from '../security/public-route.js';
import { InvitationsService } from './invitations.service.js';

@Controller({ path: 'invitations', version: '1' })
@ApiTags('invitations-public')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  @PublicRoute()
  async getPublic(@Param('token') token: string) {
    return this.invitationsService.getPublicInvitation(token);
  }

  @Post(':token/accept')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  async accept(@Param('token') token: string, @Body() body: unknown) {
    return this.invitationsService.acceptInvitation(token, body);
  }
}
