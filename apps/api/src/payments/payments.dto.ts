import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const ipnOrderDetailsSchema = z.object({
  orderId: z.string().trim().min(1, 'orderId es requerido').max(100),
  orderTotalAmount: z.coerce.number().int().min(1, 'orderTotalAmount debe ser un entero positivo en centavos'),
  orderCurrency: z.string().trim().length(3, 'orderCurrency debe tener 3 caracteres (ej. USD)'),
});

export const ipnAnswerSchema = z.object({
  orderStatus: z.string().trim().min(1, 'orderStatus es requerido'),
  orderDetails: ipnOrderDetailsSchema,
  transactions: z.array(z.object({
    uuid: z.string().trim().min(1, 'uuid de transacción es requerido'),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })).optional(),
});

export const ipnPayloadSchema = z.object({
  'kr-answer': z.union([z.string().min(2), z.record(z.string(), z.any())]),
  'kr-hash': z.string().min(1).optional(),
});

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
