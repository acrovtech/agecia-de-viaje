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
      }
    });

    // 3. Izipay Form Token
    const shopId = process.env.IZIPAY_SHOP_ID;
    const testPassword = process.env.IZIPAY_TEST_PASSWORD;

    let formToken = "DEMO_TEST_FORM_TOKEN";

    if (shopId && testPassword) {
      try {
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
        if (izipayData.status === "SUCCESS") {
          formToken = izipayData.answer.formToken;
        } else {
          console.warn("Izipay API status non-success:", izipayData);
        }
      } catch (e) {
        console.warn("Izipay API fetch failed, using fallback token:", e);
      }
    }

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
    console.error("Error creating reservation:", error);
    return { success: false, error: error?.message || "Error al crear la reserva" };
  }
}
