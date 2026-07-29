'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function updateReservationStatus(reservationId: string, status: 'PENDING' | 'PAID' | 'CANCELLED') {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status }
    });
    revalidatePath('/reservas');
    revalidatePath(`/reservas/${reservationId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return { success: false, error: "No se pudo actualizar el estado de la reserva." };
  }
}

export async function updateReservationDetails(reservationId: string, data: {
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupHotel?: string;
  specialRequirements?: string;
}) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data
    });
    revalidatePath('/reservas');
    revalidatePath(`/reservas/${reservationId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating reservation details:", error);
    return { success: false, error: "No se pudo actualizar la reserva." };
  }
}

export async function updateReservationPassengersAction(
  reservationId: string, 
  passengers: Array<{ firstName?: string; lastName?: string; name?: string; docType: string; docNumber: string }>
) {
  try {
    await prisma.reservationPassenger.deleteMany({
      where: { reservationId }
    });

    if (passengers.length > 0) {
      await prisma.reservationPassenger.createMany({
        data: passengers.map(p => {
          let fName = p.firstName || '';
          let lName = p.lastName || '';
          if (!fName && p.name) {
            const parts = p.name.trim().split(' ');
            fName = parts[0] || 'Pasajero';
            lName = parts.slice(1).join(' ') || '';
          }
          return {
            reservationId,
            firstName: fName || 'Pasajero',
            lastName: lName,
            docType: p.docType || 'DNI',
            docNumber: p.docNumber || ''
          };
        })
      });
    }

    revalidatePath(`/reservas/${reservationId}`);
    revalidatePath('/reservas');
    return { success: true };
  } catch (error) {
    console.error("Error updating reservation passengers:", error);
    return { success: false, error: "No se pudieron actualizar los pasajeros." };
  }
}

export async function deleteReservationsAction(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: true };
    await prisma.reservation.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    revalidatePath('/reservas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting reservations:", error);
    return { success: false, error: "No se pudieron eliminar las reservas seleccionadas." };
  }
}

export async function getRecentNotificationsAction() {
  try {
    const reservations = await prisma.reservation.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { tour: true }
    });
    return { 
      success: true, 
      notifications: reservations.map(r => ({
        id: r.id,
        customerName: `${r.customerFirstName} ${r.customerLastName}`,
        customerEmail: r.customerEmail,
        tourTitle: r.tour?.title || 'Tour Inca Bound',
        pax: r.pax,
        totalPrice: r.totalPrice,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, notifications: [] };
  }
}
