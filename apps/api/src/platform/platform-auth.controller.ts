import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { z } from 'zod';
import { PlatformAuthService, type PlatformIdentity } from './platform-auth.service.js';
import { PublicRoute, PlatformSessionRoute } from '../security/public-route.js';
import { PlatformLoginDto, PlatformSessionDto } from './platform-auth.dto.js';

const platformLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
}).strict();

export type AuthenticatedPlatformRequest = Request & { platformIdentity: PlatformIdentity };

@Controller({ path: 'platform/auth', version: '1' })
@ApiTags('platform-auth')
export class PlatformAuthController {
  constructor(private readonly platformAuth: PlatformAuthService) {}

  @Post('login')
  @PublicRoute()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia sesión de control de plataforma para un PlatformAdmin.' })
  @ApiBody({ type: PlatformLoginDto })
  @ApiOkResponse({ type: PlatformSessionDto })
  async login(@Body() body: unknown) {
    const parsed = platformLoginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException();
    return this.platformAuth.login(parsed.data.email, parsed.data.password);
  }

  @Get('me')
  @PlatformSessionRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene la identidad actual del administrador de plataforma.' })
  me(@Req() req: AuthenticatedPlatformRequest) {
    const { platformAdminId, email, role, displayName } = req.platformIdentity;
    return { platformAdminId, email, role, displayName };
  }

  @Post('logout')
  @HttpCode(204)
  @PlatformSessionRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cierra y revoca la sesión de control de plataforma.' })
  async logout(@Req() req: AuthenticatedPlatformRequest) {
    await this.platformAuth.logout(req.platformIdentity.sessionId);
  }
}
