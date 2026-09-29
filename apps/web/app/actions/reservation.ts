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
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

import { resolveCurrentStorefront } from '@/lib/storefront-context';

export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

async function getStorefrontSlug(): Promise<string> {
  const context = await resolveCurrentStorefront();
  if (context?.slug) {
    return context.slug;
  }
  const slug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (!slug) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: STOREFRONT_SLUG o NEXT_PUBLIC_AGENCY_SLUG es obligatorio en producción');
    }
    return 'incabound';
  }
  return slug;
}

function getApiInternalUrl(): string {
  const url = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: API_INTERNAL_URL o NEXT_PUBLIC_API_URL es obligatorio en producción');
    }
    return 'http://127.0.0.1:3002';
  }
  return url;
}

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

    // 3. Resolución segura del tenant / storefront server-side (falla cerrado en producción)
    const storefront = await getStorefrontSlug();
    const apiBaseUrl = getApiInternalUrl();

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

    // 5. Preservar la clave de idempotencia del cliente si se provee, o generar fallback
    const idempotencyKey = data.idempotencyKey || `chk_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

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
      error: error.message?.startsWith('CONFIG_ERROR')
        ? 'Configuración del sistema incompleta. Contacte con soporte.'
        : 'No se pudo conectar con el motor central de reservas. Verifique la conexión con el servidor.',
    };
  }
}
