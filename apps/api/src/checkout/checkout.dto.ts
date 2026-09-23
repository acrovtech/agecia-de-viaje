import { ApiProperty } from '@nestjs/swagger';

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
}
