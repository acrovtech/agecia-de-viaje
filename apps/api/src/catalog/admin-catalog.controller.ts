import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { PrismaService } from '../database/prisma.service.js';
import { CatalogWriteService } from './catalog-write.service.js';

const pagination = z.object({ after: z.string().min(1).max(128).optional() }).strict();
function after(query: unknown) {
  const result = pagination.safeParse(query);
  if (!result.success) throw new BadRequestException();
  return result.data.after ? { id: { gt: result.data.after } } : {};
}

@Controller({ path: 'agencies/:agencyId/catalog', version: '1' })
@ApiBearerAuth()
@ApiTags('admin-catalog')
@AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
export class AdminCatalogController {
  constructor(private readonly prisma: PrismaService, private readonly writes: CatalogWriteService) {}

  @Get('tours/:id')
  tour(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.writes.tour(req.identity.agencyId, id); }

  @Get('transfers/:id')
  transfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.writes.transfer(req.identity.agencyId, id); }

  @Post('tours')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  createTour(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.writes.createTour(req.identity, body); }

  @Put('tours/:id')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  updateTour(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.writes.updateTour(req.identity, id, body); }

  @Post('transfers')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  createTransfer(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.writes.createTransfer(req.identity, body); }

  @Put('transfers/:id')
  @AgencyRoles('OWNER', 'ADMIN', 'OPERATOR')
  updateTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return this.writes.updateTransfer(req.identity, id, body); }

  @Get('tours')
  async tours(@Req() req: AuthenticatedRequest, @Query() query: unknown) {
    const rows = await this.prisma.tour.findMany({
      where: { agencyId: req.identity.agencyId, ...after(query) },
      select: { id: true, slug: true, title: true, hasSharedService: true, sharedPrice: true, isPublished: true },
      orderBy: { id: 'asc' }, take: 51,
    });
    return { data: rows.slice(0, 50), nextCursor: rows.length > 50 ? rows[49]!.id : null };
  }

  @Get('transfers')
  async transfers(@Req() req: AuthenticatedRequest, @Query() query: unknown) {
    const rows = await this.prisma.transfer.findMany({
      where: { agencyId: req.identity.agencyId, ...after(query) },
      select: { id: true, slug: true, title: true, hasSharedService: true, sharedPrice: true, isActive: true, isPublished: true },
      orderBy: { id: 'asc' }, take: 51,
    });
    return { data: rows.slice(0, 50), nextCursor: rows.length > 50 ? rows[49]!.id : null };
  }
}
