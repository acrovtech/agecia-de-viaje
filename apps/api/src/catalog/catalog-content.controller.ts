import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { CatalogContentService } from './catalog-content.service.js';

@Controller({ path: 'agencies/:agencyId/catalog', version: '1' })
@ApiTags('catalog-content')
@ApiBearerAuth()
@AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
export class CatalogContentController {
  constructor(private readonly content: CatalogContentService) {}
  @Get('tours/:id/content')
  tour(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.content.tour(req.identity.agencyId, id); }
  @Get('transfers/:id/content')
  transfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.content.transfer(req.identity.agencyId, id); }
  @Put('tours/:id/content') @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  saveTour(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.saveTour(req.identity, id, body); }
  @Put('transfers/:id/content') @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  saveTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.saveTransfer(req.identity, id, body); }
  @Put('tours/:id/publication') @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  publishTour(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.publish(req.identity, 'tours', id, body); }
  @Put('transfers/:id/publication') @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  publishTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.publish(req.identity, 'transfers', id, body); }
  @Get('categories')
  categories(@Req() req: AuthenticatedRequest, @Query() query: unknown) { return this.content.resources(req.identity.agencyId, 'categories', query); }
  @Get('vehicles')
  vehicles(@Req() req: AuthenticatedRequest, @Query() query: unknown) { return this.content.resources(req.identity.agencyId, 'vehicles', query); }
  @Post('categories') @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  createCategory(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.content.saveCategory(req.identity, undefined, body); }
  @Put('categories/:id') @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  updateCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.saveCategory(req.identity, id, body); }
  @Post('vehicles') @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  createVehicle(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.content.saveVehicle(req.identity, undefined, body); }
  @Put('vehicles/:id') @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  updateVehicle(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.content.saveVehicle(req.identity, id, body); }
}
