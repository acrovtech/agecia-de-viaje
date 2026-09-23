import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PublicRoute } from '../security/public-route.js';
import { CheckoutResponseDto, CreateCheckoutDto } from './checkout.dto.js';
import { CheckoutService } from './checkout.service.js';

const identifier = z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

@Controller({ path: 'storefronts/:storefront/checkout', version: '1' })
@ApiTags('checkout')
@ApiParam({ name: 'storefront', description: 'Slug público de la agencia donde se crea la reserva.' })
@PublicRoute()
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Crea una intención de reserva y checkout con cotización autoritativa e idempotencia.' })
  @ApiHeader({
    name: 'idempotency-key',
    required: false,
    description: 'Clave única para evitar procesamiento duplicado ante reintentos de red.',
  })
  @ApiOkResponse({ type: CheckoutResponseDto })
  async create(
    @Param('storefront') storefront: string,
    @Body() body: CreateCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CheckoutResponseDto> {
    const parsedStorefront = identifier.safeParse(storefront);
    if (!parsedStorefront.success) throw new BadRequestException('Storefront inválido');

    return this.checkout.createCheckout(parsedStorefront.data, body, idempotencyKey);
  }
}
