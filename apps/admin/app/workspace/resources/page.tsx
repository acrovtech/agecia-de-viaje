import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Plus, CheckCircle2 } from 'lucide-react';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { categorySchema, vehicleSchema } from '../../../lib/catalog-content';
import { canEditCatalog } from '../../../lib/catalog-editor';
import { ResourceForm } from './resource-form';
import { PageHeader } from '../../../components/design-system/page-header';
import { StatusBadge } from '../../../components/design-system/status-badge';
import { EmptyState } from '../../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = params.kind === 'vehicles' ? 'vehicles' : 'categories';

  try {
    const { token, identity } = await centralSession();
    const after =
      typeof params.after === 'string' && params.after.length <= 128 ? params.after : '';
    const body = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${kind}${
        after ? `?after=${encodeURIComponent(after)}` : ''
      }`,
      token,
    );

    const result =
      kind === 'categories'
        ? z.object({ data: z.array(categorySchema), nextCursor: z.string().nullable() }).parse(body)
        : z.object({ data: z.array(vehicleSchema), nextCursor: z.string().nullable() }).parse(body);

    const allowed = canEditCatalog(identity.role, kind === 'categories' ? 'tours' : 'transfers');
    const selected = result.data.find((row) => row.id === params.edit);
    const path = `/workspace/resources?kind=${kind}`;

    return (
      <div className="space-y-6">
        <PageHeader
          title={kind === 'categories' ? 'Categorías Comerciales' : 'Vehículos Comerciales'}
          description={
            kind === 'categories'
              ? 'Etiquetas y agrupadores temáticos para la clasificación de tours.'
              : 'Categorías de vehículos comerciales ofrecidas para servicios de traslado y tours privados.'
          }
          breadcrumbs={[
            { label: 'Inicio', href: '/workspace' },
            { label: 'Recursos', href: '/workspace/resources?kind=categories' },
            { label: kind === 'categories' ? 'Categorías' : 'Vehículos', isCurrent: true },
          ]}
          actions={
            allowed && (
              <Link
                href={`${path}&edit=new`}
                className="product-button-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Crear {kind === 'categories' ? 'categoría' : 'vehículo'}</span>
              </Link>
            )
          }
        />

        {params.saved === '1' && (
          <div
            role="status"
            className="p-3 rounded-xl bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>Recurso guardado con éxito.</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-[#e5e7eb] pb-3">
          <Link
            href="/workspace/resources?kind=categories"
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              kind === 'categories'
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Categorías comerciales
          </Link>
          <Link
            href="/workspace/resources?kind=vehicles"
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              kind === 'vehicles'
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Vehículos comerciales
          </Link>
        </div>

        {allowed && (selected || params.edit === 'new') && (
          <div className="max-w-2xl product-card-surface p-6">
            <ResourceForm
              key={`${selected?.id ?? 'new'}-${selected?.updatedAt ?? ''}`}
              kind={kind}
              record={selected}
            />
          </div>
        )}

        {/* Canonical Grouped List Container */}
        <div className="product-card-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Nombre</th>
                  <th className="py-2.5 px-4 font-medium">Identificador</th>
                  {kind === 'vehicles' && (
                    <th className="py-2.5 px-4 font-medium">Capacidad</th>
                  )}
                  {kind === 'vehicles' && (
                    <th className="py-2.5 px-4 font-medium">Estado</th>
                  )}
                  {allowed && <th className="py-2.5 px-4 font-medium text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {result.data.map((row) => (
                  <tr key={row.id} className="product-data-row">
                    <td className="py-3.5 px-4 font-medium text-[#111111] text-sm">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280] font-mono text-[11px]">
                      {'slug' in row ? `/${row.slug}` : row.code}
                    </td>
                    {kind === 'vehicles' && (
                      <td className="py-3.5 px-4 text-[#111111] font-medium">
                        {'maxPax' in row ? `${row.maxPax} pax` : '-'}
                      </td>
                    )}
                    {kind === 'vehicles' && (
                      <td className="py-3.5 px-4">
                        {'isActive' in row && (
                          <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
                        )}
                      </td>
                    )}
                    {allowed && (
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`${path}&after=${encodeURIComponent(after)}&edit=${row.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No hay recursos registrados en esta página.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>{result.data.length} recursos en esta página</div>
            <div className="flex gap-4 font-semibold">
              {after && (
                <Link href={path} className="hover:underline">
                  Primera página
                </Link>
              )}
              {result.nextCursor && (
                <Link
                  href={`${path}&after=${encodeURIComponent(result.nextCursor)}`}
                  className="hover:underline"
                >
                  Siguiente página
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Error de carga"
        description="No pudimos cargar los recursos de tu agencia. Vuelve a intentarlo."
      />
    );
  }
}
