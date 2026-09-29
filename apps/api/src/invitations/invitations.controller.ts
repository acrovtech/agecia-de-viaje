import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { InvitationsService } from './invitations.service.js';

@Controller({ path: 'agencies/:agencyId/invitations', version: '1' })
@ApiTags('invitations')
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @AgencyRoles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.invitationsService.createInvitation(
      req.identity,
      agencyId,
      body
    );
  }

  @Get()
  @AgencyRoles('OWNER', 'ADMIN')
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string
  ) {
    return this.invitationsService.listInvitations(req.identity, agencyId);
  }

  @Delete(':invitationId')
  @AgencyRoles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('invitationId') invitationId: string
  ) {
    return this.invitationsService.revokeInvitation(
      req.identity,
      agencyId,
      invitationId
    );
  }
}
