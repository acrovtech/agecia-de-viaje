import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { PlatformSessionRoute, PlatformRoles } from '../security/public-route.js';
import { PlatformService } from './platform.service.js';
import { UpdatePlatformSettingsDto } from './platform.dto.js';
import type { AuthenticatedPlatformRequest } from './platform-auth.controller.js';

@Controller({ path: 'platform', version: '1' })
@ApiTags('platform-control-plane')
@PlatformSessionRoute()
@ApiBearerAuth()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('agencies')
  @ApiOperation({ summary: 'Listar agencias registradas en la plataforma con métricas autoritativas' })
  async getAgencies() {
    return this.platformService.getAgencies();
  }

  @Get('agencies/:agencyId')
  @ApiOperation({ summary: 'Detalle de agencia para administración de plataforma' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getAgencyDetail(@Param('agencyId') agencyId: string) {
    return this.platformService.getAgencyDetail(agencyId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Obtener configuración global de la plataforma' })
  async getPlatformSettings() {
    return this.platformService.getPlatformSettings();
  }

  @Put('settings')
  @PlatformRoles('SUPERADMIN')
  @ApiOperation({ summary: 'Actualizar configuración global de marca y créditos de co-branding' })
  @ApiBody({ type: UpdatePlatformSettingsDto })
  async updatePlatformSettings(
    @Req() req: AuthenticatedPlatformRequest,
    @Body() body: unknown
  ) {
    return this.platformService.updatePlatformSettings(req.platformIdentity.platformAdminId, body);
  }
}
