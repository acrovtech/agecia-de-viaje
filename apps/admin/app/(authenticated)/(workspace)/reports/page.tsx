import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { ReportsView, type ReportsData } from '@/components/workspace/views/reports-view';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const reportsSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  totalReservations: z.number(),
  grossBookedValue: z.number(),
  currency: z.string(),
  paymentStatusBreakdown: z.record(z.string(), z.object({ count: z.number(), total: z.number() })),
  bookingStatusBreakdown: z.record(z.string(), z.number()),
  reservationsByDay: z.array(z.object({ date: z.string(), count: z.number(), total: z.number() })),
  topTours: z.array(z.object({ title: z.string(), count: z.number(), total: z.number() })),
  sourceBreakdown: z.record(z.string(), z.number()),
});

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isApiAdmin()) {
    redirect('/');
  }

  const params = await searchParams;
  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    throw error;
  }

  const { token, identity } = session;
  const from = typeof params.from === 'string' && params.from.length <= 32 ? params.from : undefined;
  const to = typeof params.to === 'string' && params.to.length <= 32 ? params.to : undefined;

  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qStr = q.toString() ? `?${q.toString()}` : '';

  try {
    const raw = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/reports${qStr}`,
      token,
    );
    const data = reportsSchema.parse(raw);

    return <ReportsView data={data} from={from} to={to} />;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Error al cargar reportes"
        description="No fue posible obtener los datos de reporte para el periodo seleccionado."
        action={
          <Link href="/reports" className="underline text-xs font-semibold">
            Restablecer periodo
          </Link>
        }
      />
    );
  }
}
