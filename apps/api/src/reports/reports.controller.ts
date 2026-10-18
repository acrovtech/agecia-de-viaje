import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { ReportsService } from './reports.service.js';

@Controller({ path: 'agencies/:agencyId/reports', version: '1' })
@ApiTags('reports')
@ApiBearerAuth()
@AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener reporte consolidado de reservas y ventas de la agencia' })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha inicial (ISO o YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha final (ISO o YYYY-MM-DD)' })
  async getReport(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getReport(req.identity.agencyId, from, to);
  }
}
