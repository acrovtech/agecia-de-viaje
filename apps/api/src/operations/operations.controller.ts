import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { OperationsService } from './operations.service.js';

@Controller({ path: 'agencies/:agencyId/operations', version: '1' })
@ApiTags('operations')
@ApiBearerAuth()
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  // ---------------------------------------------------------------------------
  // SERVICE RESOURCES (GUIDES & DRIVERS)
  // ---------------------------------------------------------------------------

  @Get('resources')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Listar recursos operativos (guías y conductores)' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async listResources(
    @Param('agencyId') agencyId: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('after') after?: string,
  ) {
    return this.operationsService.listResources(agencyId, { type, isActive, after });
  }

  @Get('resources/:id')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Obtener detalle de recurso operativo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del recurso' })
  async getResource(
    @Param('agencyId') agencyId: string,
    @Param('id') resourceId: string,
  ) {
    return this.operationsService.getResource(agencyId, resourceId);
  }

  @Post('resources')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear nuevo recurso operativo (guía o conductor)' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async createResource(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.operationsService.createResource(req.identity, body);
  }

  @Put('resources/:id')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar o activar/desactivar recurso operativo' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del recurso' })
  async updateResource(
    @Req() req: AuthenticatedRequest,
    @Param('id') resourceId: string,
    @Body() body: unknown,
  ) {
    return this.operationsService.updateResource(req.identity, resourceId, body);
  }

  // ---------------------------------------------------------------------------
  // FLEET VEHICLES
  // ---------------------------------------------------------------------------

  @Get('vehicles')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Listar vehículos de flota operativa' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async listVehicles(
    @Param('agencyId') agencyId: string,
    @Query('isActive') isActive?: string,
    @Query('vehicleTypeId') vehicleTypeId?: string,
    @Query('after') after?: string,
  ) {
    return this.operationsService.listVehicles(agencyId, { isActive, vehicleTypeId, after });
  }

  @Get('vehicles/:id')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Obtener detalle de vehículo de flota' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async getVehicle(
    @Param('agencyId') agencyId: string,
    @Param('id') vehicleId: string,
  ) {
    return this.operationsService.getVehicle(agencyId, vehicleId);
  }

  @Post('vehicles')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Crear nuevo vehículo en flota operativa' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async createVehicle(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.operationsService.createVehicle(req.identity, body);
  }

  @Put('vehicles/:id')
  @AgencyRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar o activar/desactivar vehículo de flota' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async updateVehicle(
    @Req() req: AuthenticatedRequest,
    @Param('id') vehicleId: string,
    @Body() body: unknown,
  ) {
    return this.operationsService.updateVehicle(req.identity, vehicleId, body);
  }

  // ---------------------------------------------------------------------------
  // DISPATCH VIEW
  // ---------------------------------------------------------------------------

  @Get('dispatch')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Vista de despacho diario de operaciones' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  async getDispatch(
    @Param('agencyId') agencyId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('missing') missing?: string,
  ) {
    return this.operationsService.getDispatch(agencyId, { date, status, missing });
  }
}
