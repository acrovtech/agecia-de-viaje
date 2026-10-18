import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralSession, centralRequest, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { DashboardView, type DashboardReservation } from '@/components/workspace/views/dashboard-view';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const reservationItemSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  serviceTitle: z.string().nullable(),
  date: z.string(),
  pax: z.number(),
  totalPrice: z.number(),
  totalMinor: z.number().nullable().optional(),
  currency: z.string(),
  bookingStatus: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  operationStatus: z.string().nullable().optional(),
  customerFirstName: z.string(),
  customerLastName: z.string(),
  customerEmail: z.string().optional(),
  pickupHotel: z.string().nullable().optional(),
});

export default async function DashboardPage() {
  if (!isApiAdmin()) {
    redirect('/');
  }

  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Sesión no disponible"
        description="No fue posible conectar con el servicio central. Vuelve a iniciar sesión."
        action={
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Iniciar sesión
          </Link>
        }
      />
    );
  }

  const { token, identity } = session;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

  const resData = await centralRequest(`${base}/reservations?limit=100`, token).catch(() => ({ data: [] }));
  const reservations = z
    .object({ data: z.array(reservationItemSchema) })
    .safeParse(resData).data?.data || [];

  // Metric 1: Hoy
  const reservationsToday = reservations.filter((r) => r.date.slice(0, 10) === today).length;

  // Metric 2: Requieren Atención
  const attentionNeeded: { reservation: DashboardReservation; reason: string }[] = [];
  for (const r of reservations) {
    if (r.bookingStatus === 'PENDING') {
      attentionNeeded.push({ reservation: r, reason: 'Reserva pendiente de confirmación' });
    } else if (r.paymentStatus === 'PENDING') {
      attentionNeeded.push({ reservation: r, reason: 'Pago pendiente de cobro' });
    } else if (r.operationStatus === 'PENDING') {
      attentionNeeded.push({ reservation: r, reason: 'Servicio en estado pendiente de coordinación' });
    }
  }

  // Metric 3: Próximas reservas (ordenadas cronológicamente)
  const upcomingReservations = [...reservations]
    .filter((r) => r.date.slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  // If no upcoming >= today, take latest reservations
  const displayedUpcoming = upcomingReservations.length > 0
    ? upcomingReservations
    : [...reservations].sort((a, b) => b.date.localeCompare(a.date));

  // Metric 4: Carga de los próximos 7 días
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const nextDaysLoad = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = dayNames[d.getDay()] || '';
    const count = reservations.filter((r) => r.date.slice(0, 10) === dateStr).length;
    return { date: dateStr, dayName, count };
  });

  // Metric 5: Valor total pactado
  const bookedMinorTotal = reservations.reduce((acc, r) => {
    const minor = r.totalMinor ?? Math.round(r.totalPrice * 100);
    return acc + (isNaN(minor) ? 0 : minor);
  }, 0);

  const formattedBookedValue = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
  }).format(bookedMinorTotal / 100);

  return (
    <DashboardView
      identity={identity}
      reservationsToday={reservationsToday}
      upcomingReservations={displayedUpcoming}
      attentionNeeded={attentionNeeded}
      nextDaysLoad={nextDaysLoad}
      formattedBookedValue={formattedBookedValue}
      totalReservationsCount={reservations.length}
    />
  );
}
