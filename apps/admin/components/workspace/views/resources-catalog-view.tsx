import Link from 'next/link';
import { Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import { ResourceForm } from '../../../app/workspace/resources/resource-form';
import type { CategoryResource, VehicleResource } from '../../../lib/catalog-content';

export interface ResourcesCatalogViewProps {
  kind: 'categories' | 'vehicles';
  allowed: boolean;
  data: (CategoryResource | VehicleResource)[];
  nextCursor: string | null;
  editId?: string;
  selected?: CategoryResource | VehicleResource;
  saved?: boolean;
}

export function ResourcesCatalogView({
  kind,
  allowed,
  data,
  nextCursor,
  editId,
  selected,
  saved,
}: ResourcesCatalogViewProps) {
  const path = kind === 'categories' ? '/resources/categories' : '/resources/vehicles';

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === 'categories' ? 'Categorías' : 'Vehículos comerciales'}
        description={
          kind === 'categories'
            ? 'Etiquetas y agrupadores temáticos para la clasificación de tours.'
            : 'Categorías de vehículos comerciales ofrecidas para servicios de traslado y tours privados.'
        }
        actions={
          allowed && (
            <Link
              href={`${path}?edit=new`}
              className="product-button-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Crear {kind === 'categories' ? 'categoría' : 'vehículo'}</span>
            </Link>
          )
        }
      />

      {saved && (
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
          href="/resources/categories"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            kind === 'categories'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Categorías comerciales
        </Link>
        <Link
          href="/resources/vehicles"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            kind === 'vehicles'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Vehículos comerciales
        </Link>
      </div>

      {allowed && (selected || editId === 'new') && (
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
              {data.map((row) => (
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
                      <StatusBadge status={('isActive' in row && row.isActive) ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                  )}
                  {allowed && (
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`${path}?edit=${row.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-white border border-[#e5e7eb] shadow-product-card hover:bg-[#f8f9fa] rounded-md transition-colors"
                      >
                        Editar
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={kind === 'vehicles' ? 5 : 3} className="py-8 text-center text-[#898989]">
                    No hay {kind === 'categories' ? 'categorías' : 'vehículos'} registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {nextCursor && (
          <div className="p-3 border-t border-[#e5e7eb] flex justify-end bg-[#f8f9fa]">
            <Link
              href={`${path}?after=${encodeURIComponent(nextCursor)}`}
              className="product-button-secondary text-xs"
            >
              <span>Página siguiente</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
