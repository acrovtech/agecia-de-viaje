import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { OperationsDispatchView } from '@/components/workspace/views/operations-dispatch-view';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const dispatchItemSchema = z.object({
  reservationId: z.string(),
  code: z.string().nullable(),
  serviceTitle: z.string().nullable(),
  serviceType: z.string().nullable(),
  pax: z.number(),
  operationStatus: z.string().nullable(),
  pickupHotel: z.string().nullable(),
  pickupTime: z.string().nullable(),
  guide: z.object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() }).nullable(),
  driver: z.object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() }).nullable(),
  vehicle: z
    .object({
      id: z.string(),
      internalLabel: z.string(),
      plate: z.string(),
      vehicleTypeName: z.string(),
      capacity: z.number().nullable().optional(),
    })
    .nullable(),
  missing: z.object({
    guide: z.boolean(),
    driver: z.boolean(),
    vehicle: z.boolean(),
    any: z.boolean(),
  }),
});

const dispatchResponseSchema = z.object({
  date: z.string(),
  total: z.number(),
  incomplete: z.number().optional().default(0),
  data: z.array(dispatchItemSchema),
});

export default async function OperationsPage({
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
  const canOperate = ['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role);
  if (!canOperate) {
    return (
      <EmptyState
        title="Acceso Restringido"
        description="Tu rol no tiene autorización para acceder al módulo de operaciones."
        action={
          <Link href="/dashboard" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  const date = typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const missing = typeof params.missing === 'string' ? params.missing : undefined;

  const currDateObj = new Date(date + 'T12:00:00Z');
  const prevDate = new Date(currDateObj.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nextDate = new Date(currDateObj.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;
  const dispatchUrl = `${base}/operations/dispatch?date=${date}${missing ? `&missing=${missing}` : ''}`;

  let dispatchData;
  try {
    const raw = await centralRequest(dispatchUrl, token);
    dispatchData = dispatchResponseSchema.parse(raw);
  } catch {
    dispatchData = { date, total: 0, incomplete: 0, data: [] };
  }

  return (
    <OperationsDispatchView
      dispatch={{
        date: dispatchData.date,
        total: dispatchData.total,
        incomplete: dispatchData.incomplete ?? 0,
        data: dispatchData.data,
      }}
      date={date}
      today={today}
      prevDate={prevDate}
      nextDate={nextDate}
      missing={missing}
    />
  );
}
