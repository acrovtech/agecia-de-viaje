'use server';

import { z } from 'zod';

const PassengerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  docType: z.string().optional().default('DNI'),
  docNumber: z.string().optional().default(''),
});

const CartItemInputSchema = z.object({
  tourSlug: z.string().min(1, 'El slug del tour es requerido'),
  tourTitle: z.string().optional(),
  serviceType: z.enum(['shared', 'private']).optional().default('shared'),
  vehicleId: z.string().optional(),
  vehicleCode: z.string().optional(),
  pickupTime: z.string().optional(),
  pickupHotel: z.string().optional(),
  date: z.string().min(1, 'La fecha de reserva es requerida'),
  pax: z.coerce.number().int().min(1, 'Debe registrar al menos 1 pasajero'),
  price: z.number().optional(),
  totalPrice: z.number().optional(),
});

const CheckoutDataSchema = z.object({
  items: z.array(CartItemInputSchema).optional(),

  // Campos para compatibilidad con reservas directas de 1 solo item
  tourSlug: z.string().optional(),
  tourTitle: z.string().optional(),
  serviceType: z.enum(['shared', 'private']).optional().default('shared'),
  vehicleId: z.string().optional(),
  vehicleCode: z.string().optional(),
  pickupTime: z.string().optional(),
  date: z.string().optional(),
  pax: z.coerce.number().int().optional(),

  // Datos de contacto del titular
  customerFirstName: z.string().min(1, 'El nombre del titular es requerido'),
  customerLastName: z.string().min(1, 'El apellido del titular es requerido'),
  customerEmail: z.string().email('El correo electrónico ingresado no es válido'),
  customerPhone: z.string().min(5, 'El teléfono ingresado es muy corto'),
  pickupHotel: z.string().optional(),
  specialRequirements: z.string().optional(),
  passengers: z.array(PassengerSchema).optional(),
  totalPrice: z.number().optional(),
  couponCode: z.string().optional(),
});

export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

const splitName = (p: { firstName?: string; lastName?: string; name?: string; docType?: string; docNumber?: string }): { firstName: string; lastName: string; documentType: string; documentNumber: string } => {
  let fName = p.firstName || '';
  let lName = p.lastName || '';
  if (!fName && !lName && p.name) {
    const parts = p.name.trim().split(' ');
    fName = parts[0] || 'Pasajero';
    lName = parts.slice(1).join(' ') || '';
  }
  return {
    firstName: fName || 'Pasajero',
    lastName: lName || '',
    documentType: p.docType || 'DNI',
    documentNumber: p.docNumber || '',
  };
};

export async function createReservationAndPaymentToken(rawData: unknown) {
  try {
    // 1. Validación estricta de entrada con Zod
    const parsed = CheckoutDataSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Datos de reserva inválidos';
      return { success: false, error: firstError };
    }
    const data = parsed.data;

    // 2. Consolidar items a procesar (Multi-item o fallback single-item)
    let rawItems: z.infer<typeof CartItemInputSchema>[] = [];

    if (data.items && data.items.length > 0) {
      rawItems = data.items;
    } else if (data.tourSlug && data.date && data.pax) {
      rawItems = [{
        tourSlug: data.tourSlug,
        tourTitle: data.tourTitle,
        serviceType: data.serviceType || 'shared',
        vehicleId: data.vehicleId,
        vehicleCode: data.vehicleCode,
        pickupTime: data.pickupTime,
        pickupHotel: data.pickupHotel,
        date: data.date,
        pax: data.pax,
        totalPrice: data.totalPrice,
      }];
    }

    if (rawItems.length === 0) {
      return { success: false, error: 'No se enviaron servicios o tours para procesar la reserva.' };
    }

    // 3. Resolución segura del tenant / storefront server-side
    const storefront = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG || 'incabound';
    const apiBaseUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002';

    // 4. Mapear al DTO esperado por el dominio autoritativo NestJS
    const checkoutPayload = {
      customerFirstName: data.customerFirstName.trim(),
      customerLastName: data.customerLastName.trim(),
      customerEmail: data.customerEmail.trim(),
      customerPhone: data.customerPhone.trim(),
      pickupHotel: data.pickupHotel?.trim() || undefined,
      specialRequirements: data.specialRequirements?.trim() || undefined,
      couponCode: data.couponCode?.trim() || undefined,
      items: rawItems.map((item) => ({
        slug: item.tourSlug.trim(),
        serviceType: item.serviceType || 'shared',
        date: item.date,
        pax: item.pax,
        vehicleCode: item.vehicleCode || undefined,
      })),
      passengers: (data.passengers || []).map(splitName),
    };

    const idempotencyKey = crypto.randomUUID();

    const response = await fetch(`${apiBaseUrl}/v1/storefronts/${encodeURIComponent(storefront)}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(checkoutPayload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const errorMsg = Array.isArray(errBody?.message)
        ? errBody.message.join(', ')
        : (errBody?.message || `Error del motor central de reservas (${response.status})`);
      return { success: false, error: errorMsg };
    }

    const result = await response.json();

    return {
      success: true,
      reservationId: result.reservationId,
      reservationCode: result.reservationCode,
      formToken: result.formToken || null,
    };
  } catch (error: any) {
    console.error('Error al procesar reserva con la API central:', error);
    return {
      success: false,
      error: 'No se pudo conectar con el motor central de reservas. Verifique la conexión con el servidor.',
    };
  }
}
