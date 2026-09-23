import { ApiProperty } from '@nestjs/swagger';

export class IzipayIpnOrderDetailsDto {
  @ApiProperty()
  orderId!: string;

  @ApiProperty({ description: 'Monto total en unidades menores (centavos)' })
  orderTotalAmount!: number;

  @ApiProperty({ default: 'USD' })
  orderCurrency!: string;
}

export class IzipayIpnAnswerDto {
  @ApiProperty()
  orderStatus!: string;

  @ApiProperty({ type: IzipayIpnOrderDetailsDto })
  orderDetails!: IzipayIpnOrderDetailsDto;

  @ApiProperty({ required: false })
  transactions?: Array<{
    uuid: string;
    status: string;
    amount: number;
    currency: string;
  }>;
}

export class IzipayIpnPayloadDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  'kr-answer'!: IzipayIpnAnswerDto | string;

  @ApiProperty({ required: false })
  'kr-hash'?: string;
}

export class IpnProcessResultDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  reservationCode!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  paidMinor?: number;

  @ApiProperty({ required: false })
  reviewReason?: string;
}
