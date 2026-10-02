import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { canEditCatalog } from '../../../lib/catalog-editor';
import {
  tourContentSchema,
  transferContentSchema,
  categorySchema,
  vehicleSchema,
} from '../../../lib/catalog-content';
import { ContentForm, PublicationForm } from './content-form';
import { PageHeader } from '../../../components/design-system/page-header';
import { EmptyState } from '../../../components/design-system/empty-state';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function choices<T>(path: string, token: string, schema: z.ZodType<T>) {
  const rows: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page++) {
    const result = z
      .object({ data: z.array(schema), nextCursor: z.string().nullable() })
      .parse(
        await centralRequest(`${path}${after ? `?after=${encodeURIComponent(after)}` : ''}`, token),
      );
    rows.push(...result.data);
    if (!result.nextCursor) return rows;
    if (result.nextCursor === after) throw new Error('Invalid pagination');
    after = result.nextCursor;
  }
  throw new Error('Resource selection limit');
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = params.kind === 'transfers' ? 'transfers' : 'tours';
  const id = params.id;

  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    redirect(`/workspace?view=${kind}`);
  }

  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, kind)) {
      return (
        <EmptyState
          title="Acceso Restringido"
          description="Tu rol no tiene autorización para editar contenidos de este catálogo."
          action={
            <Link href="/workspace" className="underline text-xs font-semibold">
              Volver al inicio
            </Link>
          }
        />
      );
    }

    const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog`;
    const data = await centralRequest(`${base}/${kind}/${id}/content`, token);
    const record =
      kind === 'tours' ? tourContentSchema.parse(data) : transferContentSchema.parse(data);
    const categories =
      kind === 'tours' ? await choices(`${base}/categories`, token, categorySchema) : [];
    const vehicles =
      kind === 'transfers' ? await choices(`${base}/vehicles`, token, vehicleSchema) : [];

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title={record.title}
          description={
            kind === 'tours'
              ? 'Gestión de itinerarios, galerías multimedia, inclusiones, exclusiones y tarifas privadas.'
              : 'Configuración de tarifas privadas por categoría de vehículo comercial.'
          }
          actions={
            <Link
              href={`/workspace?view=${kind}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#111111] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al catálogo</span>
            </Link>
          }
        />

        {params.saved === '1' && (
          <div
            role="status"
            className="p-3 rounded-lg bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>Contenido guardado con éxito.</span>
          </div>
        )}

        <PublicationForm
          key={`publish-${record.updatedAt}`}
          kind={kind}
          id={id}
          updatedAt={record.updatedAt}
          isPublished={record.isPublished}
        />

        <ContentForm
          key={record.updatedAt}
          kind={kind}
          record={record}
          categories={categories}
          vehicles={vehicles}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Error al cargar el contenido"
        description="No pudimos abrir los contenidos de este servicio. Verifica que exista en tu agencia."
        action={
          <Link href={`/workspace?view=${kind}`} className="underline text-xs font-semibold">
            Volver al catálogo
          </Link>
        }
      />
    );
  }
}
