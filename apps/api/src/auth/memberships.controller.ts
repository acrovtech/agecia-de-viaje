import { BadRequestException, Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from './auth.controller.js';
import { z } from 'zod';

@Controller({ path: 'agencies/:agencyId/memberships', version: '1' })
@ApiTags('memberships')
@ApiBearerAuth()
export class MembershipsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @AgencyRoles('OWNER', 'ADMIN')
  async list(@Req() req: AuthenticatedRequest, @Query() query: unknown) {
    const parsed = z.object({ after: z.string().min(1).max(128).optional() }).strict().safeParse(query);
    if (!parsed.success) throw new BadRequestException();
    // Always filter with the authenticated identity, never a client-supplied ID.
    const rows = await this.prisma.agencyMembership.findMany({
      where: { agencyId: req.identity.agencyId, ...(parsed.data.after ? { id: { gt: parsed.data.after } } : {}) },
      select: { id: true, role: true, isActive: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { id: 'asc' }, take: 101,
    });
    return { data: rows.slice(0, 100), nextCursor: rows.length > 100 ? rows[99]!.id : null };
  }
}
