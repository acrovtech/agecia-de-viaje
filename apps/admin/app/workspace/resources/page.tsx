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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear {kind === 'categories' ? 'categoría' : 'vehículo'}</span>
              </Link>
            )
          }
        />

        {params.saved === '1' && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Recurso guardado con éxito.</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-slate-200/80 pb-3">
          <Link
            href="/workspace/resources?kind=categories"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              kind === 'categories'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Categorías comerciales
          </Link>
          <Link
            href="/workspace/resources?kind=vehicles"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              kind === 'vehicles'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Vehículos comerciales
          </Link>
        </div>

        {allowed && (selected || params.edit === 'new') && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <ResourceForm
              key={`${selected?.id ?? 'new'}-${selected?.updatedAt ?? ''}`}
              kind={kind}
              record={selected}
            />
          </div>
        )}

        {/* Table List */}
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Nombre</th>
                  <th className="py-3 px-4 font-semibold">Identificador</th>
                  {kind === 'vehicles' && (
                    <th className="py-3 px-4 font-semibold">Capacidad</th>
                  )}
                  {kind === 'vehicles' && (
                    <th className="py-3 px-4 font-semibold">Estado</th>
                  )}
                  {allowed && <th className="py-3 px-4 font-semibold text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {'slug' in row ? `/${row.slug}` : row.code}
                    </td>
                    {kind === 'vehicles' && (
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
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
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
