import {
  Body,
  Controller,
  Headers,
  HttpCode,
  PayloadTooLargeException,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicRoute } from '../security/public-route.js';
import { IpnProcessResultDto, IzipayIpnPayloadDto } from './payments.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller({ path: 'payments/izipay', version: '1' })
@ApiTags('payments')
@PublicRoute()
@Throttle({ default: { limit: 120, ttl: 60000 } })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('ipn')
  @HttpCode(200)
  @ApiOperation({ summary: 'Procesa el webhook IPN de confirmación de pago de Izipay con firma HMAC y outbox transaccional.' })
  @ApiHeader({
    name: 'kr-hash',
    required: false,
    description: 'Firma HMAC-SHA256 del payload kr-answer calculada por Izipay.',
  })
  @ApiOkResponse({ type: IpnProcessResultDto })
  async handleIpn(
    @Body() body: IzipayIpnPayloadDto,
    @Headers('kr-hash') headerHash?: string,
    @Headers('content-length') contentLength?: string,
  ): Promise<IpnProcessResultDto> {
    if (contentLength && parseInt(contentLength, 10) > 65536) {
      throw new PayloadTooLargeException('El tamaño del payload excede el límite permitido de 64KB');
    }
    const rawAnswer = body?.['kr-answer'];
    if (typeof rawAnswer === 'string' && rawAnswer.length > 65536) {
      throw new PayloadTooLargeException('El tamaño de kr-answer excede el límite permitido de 64KB');
    }

    return this.payments.processIzipayIpn(body, headerHash);
  }
}
