import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { serviceResourceSchema } from '@/lib/reservations';
import { PersonnelView } from '@/components/workspace/views/personnel-view';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage({
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

  const resourcesRaw = await centralRequest(`${base}/operations/resources`, token);
  const list = z
    .object({ data: z.array(serviceResourceSchema), nextCursor: z.string().nullable() })
    .parse(resourcesRaw);
  const selected = list.data.find((r) => r.id === params.edit);

  return (
    <PersonnelView
      canMutate={canMutate}
      list={list}
      editId={typeof params.edit === 'string' ? params.edit : undefined}
      selected={selected}
    />
  );
}
