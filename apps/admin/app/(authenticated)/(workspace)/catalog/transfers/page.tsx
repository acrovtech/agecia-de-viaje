import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { canEditCatalog, catalogDetailSchema } from '@/lib/catalog-editor';
import { CatalogView } from '@/components/workspace/views/catalog-view';

export const dynamic = 'force-dynamic';

const catalogSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      hasSharedService: z.boolean(),
      sharedPrice: z.number().nullable(),
      isActive: z.boolean().optional(),
      isPublished: z.boolean(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export default async function TransfersCatalogPage({
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
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/transfers`;

  const body = await centralRequest(`${base}${after ? `?after=${encodeURIComponent(after)}` : ''}`, token);
  const result = catalogSchema.parse(body);

  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  let selected;
  if (editId && editId !== 'new') {
    try {
      selected = catalogDetailSchema.parse(await centralRequest(`${base}/${encodeURIComponent(editId)}`, token));
    } catch {
      selected = undefined;
    }
  }

  const canEdit = canEditCatalog(identity.role, 'transfers');

  return (
    <CatalogView
      kind="transfers"
      canEdit={canEdit}
      editing={Boolean(editId)}
      record={selected}
      editId={editId}
      catalog={result}
      saved={params.saved === '1'}
      agencySlug={identity.agencySlug}
    />
  );
}
