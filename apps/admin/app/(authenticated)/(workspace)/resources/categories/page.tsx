import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { categorySchema } from '@/lib/catalog-content';
import { canEditCatalog } from '@/lib/catalog-editor';
import { ResourcesCatalogView } from '@/components/workspace/views/resources-catalog-view';

export const dynamic = 'force-dynamic';

export default async function CategoriesResourcePage({
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
  const after = typeof params.after === 'string' && params.after.length <= 128 ? params.after : '';
  const body = await centralRequest(
    `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/categories${
      after ? `?after=${encodeURIComponent(after)}` : ''
    }`,
    token,
  );

  const result = z.object({ data: z.array(categorySchema), nextCursor: z.string().nullable() }).parse(body);
  const allowed = canEditCatalog(identity.role, 'tours');
  const selected = result.data.find((row) => row.id === params.edit);

  return (
    <ResourcesCatalogView
      kind="categories"
      allowed={allowed}
      data={result.data}
      nextCursor={result.nextCursor}
      editId={typeof params.edit === 'string' ? params.edit : undefined}
      selected={selected}
      saved={params.saved === '1'}
    />
  );
}
