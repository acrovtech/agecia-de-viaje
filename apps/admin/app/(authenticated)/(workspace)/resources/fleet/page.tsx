import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { fleetVehicleSchema } from '@/lib/reservations';
import { FleetView } from '@/components/workspace/views/fleet-view';

export const dynamic = 'force-dynamic';

const vehicleTypeCatalogSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), maxPax: z.number() })),
});

export default async function FleetPage({
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
  const canMutate = ['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role);
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

  const [vehiclesRaw, catalogRaw] = await Promise.all([
    centralRequest(`${base}/operations/vehicles`, token),
    centralRequest(`${base}/catalog/vehicles`, token),
  ]);

  const list = z
    .object({ data: z.array(fleetVehicleSchema), nextCursor: z.string().nullable() })
    .parse(vehiclesRaw);
  const vehicleTypes = vehicleTypeCatalogSchema.parse(catalogRaw).data;
  const selected = list.data.find((v) => v.id === params.edit);

  return (
    <FleetView
      canMutate={canMutate}
      list={list}
      vehicleTypes={vehicleTypes}
      editId={typeof params.edit === 'string' ? params.edit : undefined}
      selected={selected}
    />
  );
}
