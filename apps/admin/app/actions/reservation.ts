'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminSession, requireMasterRole } from '@/lib/auth-check';

const StatusSchema = z.enum(['PENDING', 'PAID', 'CANCELLED']);

const ReservationDetailsSchema = z.object({
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerEmail: z.string().email('Email inválido').optional(),
  customerPhone: z.string().optional(),
  pickupHotel: z.string().optional(),
  specialRequirements: z.string().optional(),
});

const PassengerItemSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  docType: z.string().default('DNI'),
  docNumber: z.string().default(''),
});

export async function updateReservationStatus(reservationId: string, rawStatus: 'PENDING' | 'PAID' | 'CANCELLED') {
  try {
    await requireMasterRole();
    if (!reservationId) return { success: false, error: "ID de reserva requerido." };

    const parsedStatus = StatusSchema.safeParse(rawStatus);
    if (!parsedStatus.success) {
      return { success: false, error: "Estado de reserva no válido." };
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: parsedStatus.data }
    });

    revalidatePath('/reservas');
    revalidatePath(`/reservas/${reservationId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating reservation status:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function updateReservationDetails(reservationId: string, rawData: unknown) {
  try {
    await requireAdminSession();
    if (!reservationId) return { success: false, error: "ID de reserva requerido." };

    const parsed = ReservationDetailsSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos." };
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: parsed.data
    });

    revalidatePath('/reservas');
    revalidatePath(`/reservas/${reservationId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating reservation details:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function updateReservationPassengersAction(
  reservationId: string, 
  rawPassengers: Array<{ firstName?: string; lastName?: string; name?: string; docType: string; docNumber: string }>
) {
  try {
    await requireAdminSession();
    if (!reservationId) return { success: false, error: "ID de reserva requerido." };

    const parsed = z.array(PassengerItemSchema).safeParse(rawPassengers);
    if (!parsed.success) {
      return { success: false, error: "Datos de pasajeros inválidos." };
    }

    const passengers = parsed.data;

    // Transacción atómica: delete + create en un solo bloque con rollback garantizado
    await prisma.$transaction(async (tx) => {
      await tx.reservationPassenger.deleteMany({
        where: { reservationId }
      });

      if (passengers.length > 0) {
        await tx.reservationPassenger.createMany({
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
    });

    revalidatePath(`/reservas/${reservationId}`);
    revalidatePath('/reservas');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating reservation passengers:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function deleteReservationsAction(ids: string[]) {
  try {
    await requireMasterRole();
    if (!ids || ids.length === 0) return { success: true };

    const parsedIds = z.array(z.string()).safeParse(ids);
    if (!parsedIds.success) {
      return { success: false, error: "IDs inválidos." };
    }

    await prisma.reservation.deleteMany({
      where: {
        id: { in: parsedIds.data }
      }
    });
    revalidatePath('/reservas');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting reservations:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function getRecentNotificationsAction() {
  try {
    await requireAdminSession();
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
        tourTitle: r.tour?.title || 'Tour Perú Andino',
        pax: r.pax,
        totalPrice: r.totalPrice,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, notifications: [] };
  }
}

const CreateManualReservationSchema = z.object({
  customerFirstName: z.string().min(1, 'El nombre es requerido'),
  customerLastName: z.string().min(1, 'El apellido es requerido'),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().min(1, 'El teléfono es requerido'),
  type: z.enum(['TOUR', 'TRANSFER']),
  tourId: z.string().optional().nullable(),
  transferId: z.string().optional().nullable(),
  vehicleTypeId: z.string().optional().nullable(),
  serviceType: z.enum(['shared', 'private']).default('shared'),
  date: z.string().min(1, 'La fecha es requerida'),
  pax: z.coerce.number().min(1, 'Mínimo 1 pasajero'),
  totalPrice: z.coerce.number().min(0, 'El monto debe ser mayor o igual a 0'),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).default('PAID'),
  pickupHotel: z.string().optional().nullable(),
  pickupTime: z.string().optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  marketingCode: z.string().optional().nullable(),
});

/**
 * Crea una reserva manual registrada directamente por el operador o master.
 * Soporta atribución directa si el cliente contactó por WhatsApp con un código de Marketing (ej: MK1).
 */
export async function createManualReservationAction(rawData: unknown) {
  try {
    const session = await requireAdminSession();
    const parsed = CreateManualReservationSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de reserva incompletos.' };
    }

    const d = parsed.data;
    const cleanCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanMarketingCode = d.marketingCode ? d.marketingCode.trim().toUpperCase() : null;

    // Buscar si el código corresponde a un cupón comercial activo
    let matchedCouponId: string | null = null;
    if (cleanMarketingCode) {
      const coupon = await (prisma as any).coupon.findUnique({
        where: { code: cleanMarketingCode },
      });
      if (coupon && coupon.isActive) {
        matchedCouponId = coupon.id;
        // Incrementar usos realizados del cupón
        await (prisma as any).coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    const newReserva = await (prisma.reservation as any).create({
      data: {
        code: cleanCode,
        customerFirstName: d.customerFirstName.trim(),
        customerLastName: d.customerLastName.trim(),
        customerEmail: d.customerEmail.trim().toLowerCase(),
        customerPhone: d.customerPhone.trim(),
        date: new Date(d.date),
        pax: d.pax,
        totalPrice: d.totalPrice,
        serviceType: d.serviceType,
        status: d.status,
        pickupHotel: d.pickupHotel?.trim() || null,
        pickupTime: d.pickupTime?.trim() || null,
        specialRequirements: d.specialRequirements?.trim() || null,
        marketingCode: cleanMarketingCode,
        source: cleanMarketingCode ? 'WHATSAPP' : 'MANUAL',
        couponId: matchedCouponId,
        tourId: d.type === 'TOUR' ? d.tourId || undefined : undefined,
        transferId: d.type === 'TRANSFER' ? d.transferId || undefined : undefined,
        vehicleTypeId: d.type === 'TRANSFER' ? d.vehicleTypeId || undefined : undefined,
        assignedOperatorId: session.userId || session.id || undefined,
        passengers: {
          create: [
            {
              firstName: d.customerFirstName.trim(),
              lastName: d.customerLastName.trim(),
              docType: 'DNI / Pasaporte',
              docNumber: 'REG-MANUAL',
            }
          ]
        }
      },
      include: {
        tour: true,
        transfer: true,
        vehicleType: true
      }
    });

    revalidatePath('/reservas');
    revalidatePath('/cupones');
    revalidatePath('/marketing');
    revalidatePath('/');
    return { success: true, reservation: newReserva };
  } catch (error: any) {
    console.error('Error creating manual reservation:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}
