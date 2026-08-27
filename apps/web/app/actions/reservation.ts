'use server';

import { prisma } from '@repo/db';

type CheckoutData = {
  tourSlug: string;
  tourTitle?: string;
  serviceType?: string;
  vehicleId?: string;
  vehicleCode?: string;
  pickupTime?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  pickupHotel?: string;
  specialRequirements?: string;
  passengers?: Array<{ firstName?: string; lastName?: string; name?: string; docType?: string; docNumber?: string }>;
  date: string;
  pax: number;
  totalPrice?: number; // Informativo desde el frontend, NUNCA utilizado como autoridad de cobro
};

export async function createReservationAndPaymentToken(data: CheckoutData) {
  try {
    // 1. Validar que se haya especificado un tourSlug
    if (!data.tourSlug || typeof data.tourSlug !== 'string' || data.tourSlug.trim() === '') {
      return { success: false, error: 'Tour no especificado.' };
    }

    // 2. Buscar si es un tour o un traslado en la base de datos
    let tour = await prisma.tour.findFirst({
      where: {
        OR: [
          { slug: data.tourSlug },
          { slug: data.tourSlug.toLowerCase() }
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
          OR: [
            { slug: data.tourSlug },
            { slug: data.tourSlug.toLowerCase() }
          ]
        },
        include: {
          vehiclePrices: {
            include: {
              vehicle: true
            }
          }
        }
      });
    }

    if (!tour && !transfer) {
      return { success: false, error: 'El tour o traslado seleccionado no existe en el sistema.' };
    }

    // 3. Validar número de pasajeros (pax)
    const pax = parseInt(String(data.pax), 10);
    if (isNaN(pax) || pax <= 0) {
      return { success: false, error: 'La cantidad de pasajeros debe ser un número entero mayor a 0.' };
    }

    // 4. Calcular precio 100% autoritativo desde el Servidor (PostgreSQL)
    const isPrivate = data.serviceType === 'private';
    let serverTotalPrice = 0;
    let selectedVehicleTypeId: string | null = null;

    if (tour) {
      let serverUnitPrice = 0;
      if (isPrivate) {
        if (!tour.hasPrivateService) {
          return { success: false, error: 'Este tour no cuenta con servicio privado habilitado.' };
        }

        // Buscar la tarifa privada que coincida con la cantidad de pax
        const matchingTier = tour.privatePricing?.find(p => p.pax === pax);
        if (!matchingTier || matchingTier.price <= 0) {
          return { 
            success: false, 
            error: `No existe una tarifa privada configurada para ${pax} ${pax === 1 ? 'pasajero' : 'pasajeros'}.` 
          };
        }

        serverUnitPrice = matchingTier.price;
      } else {
        // Servicio Compartido / Grupal
        if (tour.sharedPrice === null || tour.sharedPrice === undefined || tour.sharedPrice <= 0) {
          return { success: false, error: 'Tarifa del tour compartido no configurada en el sistema.' };
        }
        serverUnitPrice = tour.sharedPrice;
      }

      serverTotalPrice = Math.round(serverUnitPrice * pax * 100) / 100;
    } else if (transfer) {
      if (isPrivate) {
        // En traslado privado el precio es por vehículo
        const matchingVehiclePrice = transfer.vehiclePrices.find(vp => 
          vp.vehicle.id === data.vehicleId || 
          vp.vehicle.code === data.vehicleCode || 
          vp.vehicleId === data.vehicleId
        ) || transfer.vehiclePrices[0];

        selectedVehicleTypeId = matchingVehiclePrice?.vehicle.id || null;
        const basePrice = matchingVehiclePrice?.price || 20;
        serverTotalPrice = basePrice;
      } else {
        const sharedPrice = transfer.sharedPrice || 10;
        serverTotalPrice = Math.round(sharedPrice * pax * 100) / 100;
      }
    }

    if (serverTotalPrice <= 0) {
      return { success: false, error: 'Error calculando el importe legítimo de la reserva.' };
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

    // 5. Crear la reserva en la Base de Datos con el precio calculado en el servidor
    const reservation = await prisma.reservation.create({
      data: {
        tourId: tour?.id || null,
        transferId: transfer?.id || null,
        serviceType: data.serviceType || (isPrivate ? 'private' : 'shared'),
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        pickupHotel: data.pickupHotel || '',
        specialRequirements: data.specialRequirements || '',
        date: data.date ? new Date(data.date) : new Date(),
        pax: pax,
        totalPrice: serverTotalPrice, // PRECIO AUTORITATIVO DEL SERVIDOR
        status: 'PENDING',
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

    // 6. Izipay Form Token con el monto 100% autoritativo en centavos
    const shopId = process.env.IZIPAY_USERNAME || process.env.IZIPAY_SHOP_ID;
    const testPassword = process.env.IZIPAY_PASSWORD_TEST || process.env.IZIPAY_TEST_PASSWORD || process.env.IZIPAY_SECRET_KEY;
    const apiUrl = process.env.IZIPAY_API_URL || 'https://api.micuentaweb.pe';
    const currency = process.env.IZIPAY_CURRENCY || 'USD';

    if (!shopId || !testPassword) {
      console.error("❌ CRÍTICO: No se encontraron las credenciales de Izipay (IZIPAY_USERNAME / IZIPAY_SHOP_ID o IZIPAY_PASSWORD_TEST / IZIPAY_TEST_PASSWORD).");
      return {
        success: false,
        error: "Configuración de pasarela de pago incompleta en el servidor. Contacte con soporte."
      };
    }

    const authHeader = `Basic ${Buffer.from(`${shopId}:${testPassword}`).toString('base64')}`;
    const amountInCents = Math.round(serverTotalPrice * 100);

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
    return { success: false, error: error?.message || "Error al crear la reserva" };
  }
}
