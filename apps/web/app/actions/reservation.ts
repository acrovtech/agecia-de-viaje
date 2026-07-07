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

    // 3. (SIMULACIÓN) Comunicarse con la API de Izipay para generar el formToken
    // En producción, aquí harías un fetch a la REST API de Izipay con Basic Auth
    // enviando: amount (totalPrice * 100), currency ("USD"), orderId (reservation.id), etc.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulated token (e.g., from Izipay)
    const simulatedIzipayToken = `DEMO-TOKEN-${reservation.id}-${Date.now()}`;

    // Update reservation with the generated reference/token just in case
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { paymentReference: simulatedIzipayToken }
    });

    return { 
      success: true, 
      reservationId: reservation.id, 
      formToken: simulatedIzipayToken 
    };

  } catch (error) {
    console.error("Error creating reservation:", error);
    return { success: false, error: "Failed to create reservation" };
  }
}
