import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicRoute } from '../security/public-route.js';
import { IpnProcessResultDto, IzipayIpnPayloadDto } from './payments.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller({ path: 'payments/izipay', version: '1' })
@ApiTags('payments')
@PublicRoute()
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
  ): Promise<IpnProcessResultDto> {
    return this.payments.processIzipayIpn(body, headerHash);
  }
}
