'use server';

import { prisma, handlePrismaError } from '@repo/db';
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

type CalculatedItem = {
  tourId: string | null;
  transferId: string | null;
  vehicleTypeId: string | null;
  title: string;
  serviceType: string;
  date: Date;
  pax: number;
  unitPrice: number;
  subtotal: number;
  pickupHotel?: string;
  pickupTime?: string;
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

    // 3. Calcular precios 100% autoritativos desde PostgreSQL para cada ítem
    const calculatedItems: CalculatedItem[] = [];
    let grandTotalPrice = 0;

    for (const item of rawItems) {
      const isPrivate = item.serviceType === 'private';
      const itemPax = item.pax;

      // Buscar tour
      const tour = await prisma.tour.findFirst({
        where: {
          isPublished: true,
          OR: [
            { slug: item.tourSlug },
            { slug: item.tourSlug.toLowerCase() }
          ]
        },
        include: {
          privatePricing: { orderBy: { pax: 'asc' } }
        }
      });

      let transfer = null;
      if (!tour) {
        transfer = await prisma.transfer.findFirst({
          where: {
            isPublished: true, isActive: true,
            OR: [
              { slug: item.tourSlug },
              { slug: item.tourSlug.toLowerCase() }
            ]
          },
          include: {
            vehiclePrices: {
              include: { vehicle: true }
            }
          }
        });
      }

      if (!tour && !transfer) {
        return { 
          success: false, 
          error: `El servicio "${item.tourTitle || item.tourSlug}" no existe en el sistema.` 
        };
      }

      let unitPrice = 0;
      let subtotal = 0;
      let vehicleTypeId: string | null = null;

      if (tour) {
        if (isPrivate) {
          if (!tour.hasPrivateService) {
            return { success: false, error: `El tour "${tour.title}" no cuenta con servicio privado.` };
          }
          const matchingTier = tour.privatePricing?.find(p => p.pax === itemPax);
          if (!matchingTier || matchingTier.price <= 0) {
            return {
              success: false,
              error: `No existe tarifa privada configurada para ${itemPax} personas en "${tour.title}".`
            };
          }
          unitPrice = matchingTier.price;
        } else {
          if (tour.sharedPrice === null || tour.sharedPrice === undefined || tour.sharedPrice <= 0) {
            return { success: false, error: `Tarifa compartida no configurada para "${tour.title}".` };
          }
          unitPrice = tour.sharedPrice;
        }
        subtotal = Math.round(unitPrice * itemPax * 100) / 100;
      } else if (transfer) {
        if (isPrivate) {
          const matchingVehiclePrice = transfer.vehiclePrices.find(vp => 
            vp.vehicle.id === item.vehicleId || 
            vp.vehicle.code === item.vehicleCode || 
            vp.vehicleId === item.vehicleId
          ) || transfer.vehiclePrices[0];

          vehicleTypeId = matchingVehiclePrice?.vehicle.id || null;
          unitPrice = matchingVehiclePrice?.price || 20;
          subtotal = unitPrice; // En traslado privado el precio es fijo por vehículo
        } else {
          unitPrice = transfer.sharedPrice || 10;
          subtotal = Math.round(unitPrice * itemPax * 100) / 100;
        }
      }

      if (subtotal <= 0) {
        return { success: false, error: `Error calculando el importe legítimo para "${item.tourTitle || item.tourSlug}".` };
      }

      calculatedItems.push({
        tourId: tour?.id || null,
        transferId: transfer?.id || null,
        vehicleTypeId,
        title: tour?.title || transfer?.title || 'Servicio Inca Bound',
        serviceType: isPrivate ? 'private' : 'shared',
        date: item.date ? new Date(item.date) : new Date(),
        pax: itemPax,
        unitPrice,
        subtotal,
        pickupHotel: item.pickupHotel || data.pickupHotel,
        pickupTime: item.pickupTime,
      });

      grandTotalPrice += subtotal;
    }

    grandTotalPrice = Math.round(grandTotalPrice * 100) / 100;
    const originalPrice = grandTotalPrice;
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let appliedMarketingCode: string | null = null;

    // Validación autoritativa de cupón de descuento en servidor
    if (data.couponCode) {
      const cleanCouponCode = data.couponCode.trim().toUpperCase();
      const coupon = await (prisma as any).coupon.findUnique({
        where: { code: cleanCouponCode },
      });

      const now = new Date();
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || new Date(coupon.expiresAt) >= now) &&
        (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit) &&
        (!coupon.minSpend || grandTotalPrice >= coupon.minSpend)
      ) {
        appliedCouponId = coupon.id;
        appliedMarketingCode = coupon.code;

        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (grandTotalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        discountAmount = Math.min(discountAmount, grandTotalPrice);
        discountAmount = Math.round(discountAmount * 100) / 100;
        grandTotalPrice = Math.max(0, Math.round((grandTotalPrice - discountAmount) * 100) / 100);

        // Incrementar usos realizados del cupón automáticamente en BD
        await (prisma as any).coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    // Helper para separar nombre en firstName y lastName si viene consolidado
    const splitName = (p: { firstName?: string; lastName?: string; name?: string }): { firstName: string; lastName: string } => {
      if (p.firstName && p.lastName) return { firstName: p.firstName, lastName: p.lastName };
      const fullName = (p.name || '').trim();
      const parts = fullName.split(' ');
      if (parts.length > 1) {
        return { firstName: parts[0] || 'Pasajero', lastName: parts.slice(1).join(' ') || '' };
      }
      return { firstName: fullName || 'Pasajero', lastName: '' };
    };

    const firstItem = calculatedItems[0];
    const maxPax = Math.max(...calculatedItems.map(it => it.pax), 1);
    const reservationCode = `IB-${Date.now().toString(36).toUpperCase()}`;

    // 4. Crear la reserva en la Base de Datos con todos sus ReservationItems
    const reservation = await (prisma.reservation as any).create({
      data: {
        code: reservationCode,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        pickupHotel: data.pickupHotel || '',
        specialRequirements: data.specialRequirements || '',
        date: firstItem?.date || new Date(),
        pax: maxPax,
        totalPrice: grandTotalPrice,
        originalPrice: discountAmount > 0 ? originalPrice : null,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        couponId: appliedCouponId,
        marketingCode: appliedMarketingCode,
        source: appliedCouponId ? 'ECOMMERCE' : 'WEB',
        currency: 'USD',
        status: 'PENDING',
        // Campos de compatibilidad directa hacia atrás
        tourId: firstItem?.tourId || null,
        transferId: firstItem?.transferId || null,
        serviceType: firstItem?.serviceType || 'shared',
        // Colección normalizada multi-tour
        items: {
          create: calculatedItems.map(item => ({
            tourId: item.tourId,
            transferId: item.transferId,
            vehicleTypeId: item.vehicleTypeId,
            serviceType: item.serviceType,
            date: item.date,
            pax: item.pax,
            unitPrice: item.unitPrice,
            totalPrice: item.subtotal,
            pickupHotel: item.pickupHotel || '',
            pickupTime: item.pickupTime || '',
          }))
        },
        passengers: data.passengers && data.passengers.length > 0 ? {
          create: data.passengers.map(p => {
            const { firstName, lastName } = splitName(p);
            return {
              firstName,
              lastName,
              docType: p.docType || 'DNI',
              docNumber: p.docNumber || ''
            };
          })
        } : undefined
      }
    });

    // 5. Izipay Form Token con el monto total autoritativo en centavos
    const shopId = process.env.IZIPAY_SHOP_ID || process.env.IZIPAY_USERNAME;
    const testPassword = process.env.IZIPAY_TEST_PASSWORD || process.env.IZIPAY_PASSWORD_TEST || process.env.IZIPAY_SECRET_KEY;
    const apiUrl = process.env.IZIPAY_API_URL || process.env.IZIPAY_ENDPOINT || 'https://api.micuentaweb.pe';
    const currency = process.env.IZIPAY_CURRENCY || 'USD';

    if (!shopId || !testPassword) {
      console.error("❌ CRÍTICO: No se encontraron las credenciales de Izipay (IZIPAY_SHOP_ID / IZIPAY_TEST_PASSWORD).");
      return {
        success: false,
        error: "Configuración de pasarela de pago incompleta en el servidor. Contacte con soporte."
      };
    }

    const authHeader = `Basic ${Buffer.from(`${shopId}:${testPassword}`).toString('base64')}`;
    const amountInCents = Math.round(grandTotalPrice * 100);

    const izipayResponse = await fetch(`${apiUrl}/api-payment/V4/Charge/CreatePayment`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: currency,
        orderId: reservation.id,
        customer: {
          email: data.customerEmail,
          billingDetails: {
            firstName: data.customerFirstName,
            lastName: data.customerLastName,
            phoneNumber: data.customerPhone,
          }
        }
      })
    });

    const izipayData = await izipayResponse.json();

    if (izipayData.status !== "SUCCESS" || !izipayData.answer?.formToken) {
      console.error("❌ CRÍTICO: Error obteniendo Form Token de Izipay:", izipayData);
      return {
        success: false,
        error: izipayData._error?.message || "No se pudo iniciar la transacción con la pasarela de pago."
      };
    }

    const formToken = izipayData.answer.formToken;

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { paymentReference: formToken }
    });

    return { 
      success: true, 
      reservationId: reservation.id, 
      formToken: formToken 
    };
  } catch (error: any) {
    console.error("Error al crear reserva:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}
