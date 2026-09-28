import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const checkoutItemSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  serviceType: z.enum(['shared', 'private']),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  pax: z.coerce.number().int().min(1, 'Mínimo 1 pasajero').max(100, 'Máximo 100 pasajeros'),
  vehicleCode: z.string().trim().max(60).optional(),
});

export const passengerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  documentType: z.string().trim().max(20).default('DNI'),
  documentNumber: z.string().trim().max(40).default(''),
});

export const createCheckoutSchema = z.object({
  customerFirstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  customerLastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  customerEmail: z.string().trim().email('Correo electrónico inválido').max(150),
  customerPhone: z.string().trim().min(5, 'Teléfono muy corto').max(30),
  items: z.array(checkoutItemSchema).min(1, 'Debe incluir al menos un servicio').max(20),
  couponCode: z.string().trim().max(50).optional(),
  pickupHotel: z.string().trim().max(200).optional(),
  specialRequirements: z.string().trim().max(1000).optional(),
  passengers: z.array(passengerSchema).max(100).optional(),
});

export const idempotencyKeySchema = z.string().trim().min(8).max(128).regex(/^[a-zA-Z0-9_\-.:]+$/, 'Formato de Idempotency-Key inválido').optional();

export class CheckoutItemDto {
  @ApiProperty({ description: 'Slug del tour o traslado' })
  slug!: string;

  @ApiProperty({ enum: ['shared', 'private'] })
  serviceType!: 'shared' | 'private';

  @ApiProperty({ description: 'Fecha del servicio YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pax!: number;

  @ApiProperty({ required: false, description: 'Código del vehículo si es traslado privado' })
  vehicleCode?: string;
}

export class PassengerDto {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ default: 'DNI' })
  documentType!: string;

  @ApiProperty()
  documentNumber!: string;
}

export class CreateCheckoutDto {
  @ApiProperty()
  customerFirstName!: string;

  @ApiProperty()
  customerLastName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty()
  customerPhone!: string;

  @ApiProperty({ type: [CheckoutItemDto] })
  items!: CheckoutItemDto[];

  @ApiProperty({ required: false })
  couponCode?: string;

  @ApiProperty({ required: false })
  pickupHotel?: string;

  @ApiProperty({ required: false })
  specialRequirements?: string;

  @ApiProperty({ type: [PassengerDto], required: false })
  passengers?: PassengerDto[];
}

export class CheckoutItemResponseDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  serviceType!: string;

  @ApiProperty()
  pax!: number;

  @ApiProperty({ description: 'Subtotal en centavos USD' })
  subtotalMinor!: number;
}

export class CheckoutResponseDto {
  @ApiProperty()
  reservationId!: string;

  @ApiProperty()
  reservationCode!: string;

  @ApiProperty({ description: 'Total a pagar en centavos USD' })
  totalMinor!: number;

  @ApiProperty({ description: 'Subtotal sin descuento en centavos USD' })
  subtotalMinor!: number;

  @ApiProperty({ description: 'Descuento aplicado en centavos USD' })
  discountMinor!: number;

  @ApiProperty({ enum: ['USD'] })
  currency!: 'USD';

  @ApiProperty({ type: [CheckoutItemResponseDto] })
  items!: CheckoutItemResponseDto[];

  @ApiProperty({ description: 'Estado actual de la reserva' })
  bookingStatus!: string;

  @ApiProperty({ description: 'Estado actual del pago' })
  paymentStatus!: string;

  @ApiProperty({ required: false, nullable: true, description: 'Token de formulario para Izipay Embedded' })
  formToken?: string | null;
}
