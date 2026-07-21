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
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return { success: false, error: "No se pudo actualizar el estado de la reserva." };
  }
}
