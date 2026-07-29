'use server';

import { prisma } from '@repo/db';

type CheckoutData = {
  tourSlug: string;
  tourTitle: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  pickupHotel?: string;
  specialRequirements?: string;
  passengers?: Array<{ firstName?: string; lastName?: string; name?: string; docType?: string; docNumber?: string }>;
  date: string;
  pax: number;
  totalPrice: number;
};

export async function createReservationAndPaymentToken(data: CheckoutData) {
  try {
    // 1. Buscar el tour por slug, o primer tour disponible
    let tour = data.tourSlug ? await prisma.tour.findUnique({
      where: { slug: data.tourSlug }
    }) : null;

    if (!tour) {
      tour = await prisma.tour.findFirst();
    }

    if (!tour) {
      return { success: false, error: 'No hay tours disponibles en la base de datos.' };
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

    // 2. Crear la reserva en la Base de Datos
    const reservation = await prisma.reservation.create({
      data: {
        tourId: tour.id,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        pickupHotel: data.pickupHotel || '',
        specialRequirements: data.specialRequirements || '',
        date: data.date ? new Date(data.date) : new Date(),
        pax: data.pax || 1,
        totalPrice: data.totalPrice || 100,
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

    // 3. Izipay Form Token (Sin token fallback silencioso)
    const shopId = process.env.IZIPAY_SHOP_ID;
    const testPassword = process.env.IZIPAY_TEST_PASSWORD;

    if (!shopId || !testPassword) {
      console.error("❌ CRÍTICO: No se encontraron las credenciales de Izipay (IZIPAY_SHOP_ID o IZIPAY_TEST_PASSWORD).");
      return {
        success: false,
        error: "Configuración de pasarela de pago incompleta en el servidor. Contacte con soporte."
      };
    }

    const authHeader = `Basic ${Buffer.from(`${shopId}:${testPassword}`).toString('base64')}`;
    const izipayResponse = await fetch("https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round((data.totalPrice || 100) * 100),
        currency: "USD",
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
