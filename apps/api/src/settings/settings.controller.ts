import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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

  // ---------------------------------------------------------------------------
  // ENTITLEMENTS
  // ---------------------------------------------------------------------------
  @Get('entitlements')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Obtener capacidades y límites autorizados de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getEntitlements(@Param('agencyId') agencyId: string) {
    return this.settingsService.getEntitlements(agencyId);
  }

  // ---------------------------------------------------------------------------
  // CATALOG LOCALES
  // ---------------------------------------------------------------------------
  @Get('locales')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Listar idiomas habilitados para el catálogo de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getLocales(@Param('agencyId') agencyId: string) {
    return this.settingsService.getLocales(agencyId);
  }

  @Post('locales')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Habilitar un nuevo idioma para el catálogo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async addLocale(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.settingsService.addLocale(req.identity, agencyId, body);
  }

  @Put('locales/:id/default')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Establecer idioma predeterminado del catálogo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del registro de idioma' })
  async setDefaultLocale(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('id') localeId: string
  ) {
    return this.settingsService.setDefaultLocale(req.identity, agencyId, localeId);
  }

  @Delete('locales/:id')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Deshabilitar o eliminar un idioma del catálogo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del registro de idioma' })
  async removeLocale(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('id') localeId: string
  ) {
    return this.settingsService.removeLocale(req.identity, agencyId, localeId);
  }

  // ---------------------------------------------------------------------------
  // AI CREDITS
  // ---------------------------------------------------------------------------
  @Get('credits')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Consultar saldo y movimientos del libro mayor de créditos IA' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getCredits(@Param('agencyId') agencyId: string) {
    return this.settingsService.getCredits(agencyId);
  }

  // ---------------------------------------------------------------------------
  // PRODUCT FEEDBACK
  // ---------------------------------------------------------------------------
  @Post('feedback')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Enviar reporte de error, sugerencia o solicitud de función' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async createFeedback(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.settingsService.createFeedback(req.identity, agencyId, body);
  }

  @Get('feedback')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Listar retroalimentación registrada para la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async listFeedback(@Param('agencyId') agencyId: string) {
    return this.settingsService.listFeedback(agencyId);
  }

  // ---------------------------------------------------------------------------
  // CO-BRANDING & MONTHLY AI CREDIT REWARD
  // ---------------------------------------------------------------------------
  @Get('branding')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
  @ApiOperation({ summary: 'Obtener configuración de co-branding y estado de recompensa de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getBranding(@Param('agencyId') agencyId: string) {
    return this.settingsService.getBranding(agencyId);
  }

  @Put('branding')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar preferencia de co-branding de la agencia' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async updateBranding(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Body() body: unknown
  ) {
    return this.settingsService.updateBranding(req.identity, agencyId, body);
  }

  @Post('branding/reward')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Reclamar recompensa mensual de créditos IA por mantener co-branding activo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async claimBrandingReward(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string
  ) {
    return this.settingsService.claimBrandingReward(req.identity, agencyId);
  }
}

