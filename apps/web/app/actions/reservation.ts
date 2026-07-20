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
    // 1. Buscar el ID real del Tour en la BD usando el slug
    let tourId = "fallback-id";
    const tour = await prisma.tour.findUnique({
      where: { slug: data.tourSlug }
    });

    if (tour) {
      tourId = tour.id;
    } else {
      // Si el tour no existe (ej. mock data), buscamos cualquier tour para asociarlo en dev
      const anyTour = await prisma.tour.findFirst();
      if (anyTour) tourId = anyTour.id;
    }

    // 2. Crear la reserva en la Base de Datos con estado PENDING
    const reservation = await prisma.reservation.create({
      data: {
        tourId: tourId,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        pickupHotel: data.pickupHotel,
        specialRequirements: data.specialRequirements,
        date: new Date(data.date),
        pax: data.pax,
        totalPrice: data.totalPrice,
        status: 'PENDING',
      }
    });

    // 3. Comunicarse con la API de Izipay para generar el formToken
    const shopId = process.env.IZIPAY_SHOP_ID;
    const testPassword = process.env.IZIPAY_TEST_PASSWORD;

    if (!shopId || !testPassword) {
      throw new Error("Izipay credentials are not configured");
    }

    let formToken = "";
    const authHeader = `Basic ${Buffer.from(`${shopId}:${testPassword}`).toString('base64')}`;

      const izipayResponse = await fetch("https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(data.totalPrice * 100), // Izipay espera el monto en céntimos
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
        console.error("IziPay Error:", izipayData);
        throw new Error("Error generating IziPay form token");
      }

    // Update reservation with the generated reference/token
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { paymentReference: formToken }
    });

    return { 
      success: true, 
      reservationId: reservation.id, 
      formToken: formToken 
    };

  } catch (error) {
    console.error("Error creating reservation:", error);
    return { success: false, error: "Failed to create reservation" };
  }
}
