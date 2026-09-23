import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { ReservationsService } from './reservations.service.js';

@Controller({ path: 'agencies/:agencyId/reservations', version: '1' })
@ApiTags('reservations')
@ApiBearerAuth()
@AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}
  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: unknown) { return this.reservations.list(req.identity.agencyId, query); }
  @Get(':id')
  detail(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.reservations.detail(req.identity.agencyId, id); }
  @Post('quote')
  quote(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.reservations.quote(req.identity.agencyId, body); }
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.reservations.create(req.identity, body); }
  @Put(':id/status')
  transition(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.reservations.transition(req.identity, id, body); }
}
