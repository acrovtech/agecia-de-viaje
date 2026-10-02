import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralSession, centralRequest, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { DashboardView } from '@/components/workspace/views/dashboard-view';
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
  operationStatus: z.string().nullable(),
  customerFirstName: z.string(),
  customerLastName: z.string(),
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

  const [resData, dispatchData] = await Promise.all([
    centralRequest(`${base}/reservations?limit=30`, token).catch(() => ({ data: [] })),
    centralRequest(`${base}/operations/dispatch?date=${today}`, token).catch(() => ({
      total: 0,
      data: [],
    })),
  ]);

  const reservations = z
    .object({ data: z.array(reservationItemSchema) })
    .safeParse(resData).data?.data || [];
  const dispatchTotal = typeof dispatchData?.total === 'number' ? dispatchData.total : 0;
  const dispatchItems = Array.isArray(dispatchData?.data) ? dispatchData.data : [];
  const dispatchIncomplete = dispatchItems.filter((item: any) => item?.missing?.any).length;

  const reservationsToday = reservations.filter((r) => r.date.slice(0, 10) === today).length;
  const pendingReservations = reservations.filter((r) => r.operationStatus === 'PENDING').length;

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
      reservations={reservations}
      dispatchTotal={dispatchTotal}
      dispatchIncomplete={dispatchIncomplete}
      reservationsToday={reservationsToday}
      pendingReservations={pendingReservations}
      formattedBookedValue={formattedBookedValue}
    />
  );
}
