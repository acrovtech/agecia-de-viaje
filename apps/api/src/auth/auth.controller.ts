import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { z } from 'zod';
import { AuthService, type ApiIdentity } from './auth.service.js';
import { PublicRoute, SessionRoute } from '../security/public-route.js';
import { LoginDto, SessionDto } from './auth.dto.js';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
  agencySlug: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict();
export type AuthenticatedRequest = Request & { identity: ApiIdentity };

@Controller({ path: 'auth', version: '1' })
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @PublicRoute()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia una sesión de una hora para una membresía explícita.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: SessionDto })
  login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.auth.login(parsed.data.email, parsed.data.password, parsed.data.agencySlug);
  }

  @Get('me')
  @SessionRoute()
  @ApiBearerAuth()
  me(@Req() req: AuthenticatedRequest) {
    const { userId, email, agencyId, membershipId, role, agencyName, agencySlug } = req.identity;
    return { userId, email, agencyId, membershipId, role, agencyName, agencySlug };
  }

  @Post('logout')
  @HttpCode(204)
  @SessionRoute()
  @ApiBearerAuth()
  async logout(@Req() req: AuthenticatedRequest) {
    await this.auth.logout(req.identity.sessionId);
  }
}
