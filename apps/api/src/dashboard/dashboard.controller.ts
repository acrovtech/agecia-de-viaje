import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { DashboardService } from './dashboard.service.js';

@Controller({ path: 'agencies/:agencyId/dashboard', version: '1' })
@ApiTags('dashboard')
@ApiBearerAuth()
@AgencyRoles('OWNER', 'ADMIN', 'OPERATOR', 'EDITOR', 'VIEWER')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener datos operacionales y comerciales consolidados para Inicio' })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(req.identity.agencyId);
  }
}
