import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { SettingsService } from './settings.service.js';

@Controller({ path: 'agencies/:agencyId/settings', version: '1' })
@ApiTags('settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('profile')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Obtener configuración del perfil de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getProfile(@Param('agencyId') agencyId: string) {
    return this.settingsService.getProfile(agencyId);
  }

  @Put('profile')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar configuración del perfil de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.settingsService.updateProfile(req.identity, agencyId, body);
  }

  @Get('legal')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Obtener perfil legal y datos fiscales de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getLegalProfile(@Param('agencyId') agencyId: string) {
    return this.settingsService.getLegalProfile(agencyId);
  }

  @Put('legal')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar perfil legal y datos fiscales de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async updateLegalProfile(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.settingsService.updateLegalProfile(req.identity, agencyId, body);
  }
}
