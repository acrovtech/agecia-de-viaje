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
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

  let dashboardData: any;
  try {
    dashboardData = await centralRequest(`${base}/dashboard`, token);
  } catch {
    dashboardData = {
      reservationsToday: 0,
      upcomingReservations: [],
      attentionNeeded: [],
      next7DaysLoad: [],
      bookedValueSummary: {
        totalCount: 0,
        totalsByCurrency: {},
      },
    };
  }

  return (
    <DashboardView
      identity={identity}
      reservationsToday={dashboardData.reservationsToday ?? 0}
      upcomingReservations={dashboardData.upcomingReservations ?? []}
      attentionNeeded={dashboardData.attentionNeeded ?? []}
      nextDaysLoad={dashboardData.next7DaysLoad ?? dashboardData.nextDaysLoad ?? []}
      totalsByCurrency={dashboardData.bookedValueSummary?.totalsByCurrency ?? {}}
      formattedBookedValue={dashboardData.bookedValueSummary?.formattedValue}
      totalReservationsCount={dashboardData.bookedValueSummary?.totalCount ?? 0}
    />
  );
}
