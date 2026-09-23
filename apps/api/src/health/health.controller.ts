import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../database/prisma.service.js';
import { PublicRoute } from '../security/public-route.js';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
@ApiTags('health')
@PublicRoute()
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({ summary: 'Comprueba que el proceso responde, sin consultar la base.' })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Comprueba conexión con PostgreSQL, sin publicar detalles internos.' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}
