import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from './auth.controller.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { z } from 'zod';

@Controller({ path: 'agencies/:agencyId/memberships', version: '1' })
@ApiTags('memberships')
@ApiBearerAuth()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @AgencyRoles('OWNER', 'ADMIN')
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Query() query: unknown
  ) {
    const parsed = z
      .object({ after: z.string().min(1).max(128).optional() })
      .strict()
      .safeParse(query);
    if (!parsed.success) throw new BadRequestException();

    return this.membershipsService.list(
      req.identity,
      agencyId,
      parsed.data.after
    );
  }

  @Patch(':membershipId')
  @AgencyRoles('OWNER', 'ADMIN')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('membershipId') membershipId: string,
    @Body() body: unknown
  ) {
    return this.membershipsService.update(
      req.identity,
      agencyId,
      membershipId,
      body
    );
  }

  @Delete(':membershipId')
  @AgencyRoles('OWNER')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('membershipId') membershipId: string
  ) {
    return this.membershipsService.delete(
      req.identity,
      agencyId,
      membershipId
    );
  }
}
