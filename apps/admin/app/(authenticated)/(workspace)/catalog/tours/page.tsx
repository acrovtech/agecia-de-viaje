import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { canEditCatalog, catalogDetailSchema } from '@/lib/catalog-editor';
import { categorySchema, tourContentSchema, tourTranslationsResponseSchema } from '@/lib/catalog-content';
import { fetchAgencyLocales } from '@/lib/settings-loader';
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
      cardImage: z.string().nullable().optional(),
      bannerImage: z.string().nullable().optional(),
      duration: z.string().nullable().optional(),
      region: z.string().nullable().optional(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export default async function ToursCatalogPage({
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
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/tours`;

  const [body, categoriesRes, agencyLocalesRes] = await Promise.all([
    centralRequest(`${base}${after ? `?after=${encodeURIComponent(after)}` : ''}`, token),
    centralRequest(`/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/categories`, token).catch(() => ({ data: [] })),
    fetchAgencyLocales(token, identity.agencyId),
  ]);
  const agencyLocales = agencyLocalesRes || {
    locales: [{ id: 'default', locale: 'es', isDefault: true, enabled: true }],
    defaultLocale: 'es',
    enabledCount: 1,
    maxCatalogLocales: 1,
    supportedLocales: ['es', 'en', 'pt', 'fr', 'de', 'it'],
  };
  const result = catalogSchema.parse(body);
  const categories = z.object({ data: z.array(categorySchema) }).parse(categoriesRes).data;

  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  let selected;
  let translationsData = null;
  const rawLocale = typeof params.locale === 'string' ? params.locale.trim().toLowerCase() : undefined;
  let selectedLocale = agencyLocales.defaultLocale;

  if (editId === 'new') {
    // New tour can ONLY be created in default locale (Requirement 9 & 23)
    if (rawLocale && rawLocale !== agencyLocales.defaultLocale) {
      redirect('/catalog/tours?edit=new');
    }
    selectedLocale = agencyLocales.defaultLocale;
  } else if (editId) {
    try {
      const [contentRes, translationsRes] = await Promise.all([
        centralRequest(`${base}/${encodeURIComponent(editId)}/content`, token),
        centralRequest(`${base}/${encodeURIComponent(editId)}/translations`, token).catch(() => null),
      ]);
      selected = tourContentSchema.parse(contentRes);
      if (translationsRes) {
        const parsed = tourTranslationsResponseSchema.safeParse(translationsRes);
        if (parsed.success) {
          translationsData = parsed.data;
        }
      }
    } catch {
      selected = undefined;
    }

    if (rawLocale) {
      if (rawLocale === agencyLocales.defaultLocale) {
        selectedLocale = agencyLocales.defaultLocale;
      } else {
        // Requirement 23: Disabled/unsupported/unconfigured locale access must not render editable translation
        const isEnabledLocale = agencyLocales.locales.some(
          (l) => l.enabled && l.locale === rawLocale
        );
        if (!isEnabledLocale) {
          redirect(`/catalog/tours?edit=${encodeURIComponent(editId)}`);
        }
        selectedLocale = rawLocale;
      }
    }
  }

  const canEdit = canEditCatalog(identity.role, 'tours');

  return (
    <CatalogView
      kind="tours"
      canEdit={canEdit}
      editing={Boolean(editId)}
      record={selected}
      editId={editId}
      categories={categories}
      catalog={result}
      saved={params.saved === '1'}
      agencySlug={identity.agencySlug}
      agencyLocales={agencyLocales}
      translationsData={translationsData}
      selectedLocale={selectedLocale}
    />
  );
}

