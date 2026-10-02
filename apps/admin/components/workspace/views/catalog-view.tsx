import Link from 'next/link';
import { Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import { CatalogEditor } from '../catalog-editor';
import type { CatalogDetail } from '../../../lib/catalog-editor';

export interface CatalogItem {
  id: string;
  title: string;
  slug: string;
  hasSharedService: boolean;
  sharedPrice: number | null;
  isActive?: boolean;
  isPublished: boolean;
}

export interface CatalogViewProps {
  kind: 'tours' | 'transfers';
  canEdit: boolean;
  editing: boolean;
  record?: CatalogDetail;
  editId?: string;
  catalog?: {
    data: CatalogItem[];
    nextCursor: string | null;
  };
  saved?: boolean;
  errorMessage?: string;
  agencySlug: string;
}

export function CatalogView({
  kind,
  canEdit,
  editing,
  record,
  editId,
  catalog,
  saved,
  errorMessage,
  agencySlug,
}: CatalogViewProps) {
  const baseRoute = kind === 'tours' ? '/catalog/tours' : '/catalog/transfers';
  const isNew = editId === 'new';

  if (editing && canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isNew ? (kind === 'tours' ? 'Crear Tour' : 'Crear Traslado') : `Editar: ${record?.title ?? ''}`}
          description={
            isNew
              ? 'Registra un nuevo servicio en el catálogo comercial de tu agencia.'
              : 'Modifica la información básica, descripciones y precios.'
          }
          actions={
            <Link
              href={baseRoute}
              className="product-button-secondary text-xs"
            >
              Cancelar
            </Link>
          }
        />

        <div className="product-card-surface p-6">
          {errorMessage ? (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {errorMessage}
            </p>
          ) : (
            <CatalogEditor
              kind={kind}
              record={record}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === 'tours' ? 'Catálogo de Tours' : 'Catálogo de Traslados'}
        description={
          kind === 'tours'
            ? 'Experiencias turísticas y excursiones ofrecidas por tu agencia.'
            : 'Servicios de transporte y traslados privados o compartidos.'
        }
        actions={
          canEdit && (
            <Link
              href={`${baseRoute}?edit=new`}
              className="product-button-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Crear {kind === 'tours' ? 'tour' : 'traslado'}</span>
            </Link>
          )
        }
      />

      {saved && (
        <div
          role="status"
          className="p-3 rounded-lg bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Servicio guardado con éxito.</span>
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
          {errorMessage}
        </p>
      )}

      {catalog && (
        <div className="product-card-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Servicio</th>
                  <th className="py-2.5 px-4 font-medium">Modalidad</th>
                  <th className="py-2.5 px-4 font-medium">Tarifa Compartida</th>
                  <th className="py-2.5 px-4 font-medium">Estado</th>
                  {kind === 'transfers' && (
                    <th className="py-2.5 px-4 font-medium">Operatividad</th>
                  )}
                  <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {catalog.data.map((item) => (
                  <tr key={item.id} className="product-data-row">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111111] text-sm">{item.title}</div>
                      <div className="text-[11px] text-[#6b7280] font-mono">/{item.slug}</div>
                    </td>
                    <td className="py-3 px-4 text-[#374151]">
                      {item.hasSharedService ? 'Compartido' : 'Solo privado'}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111111]">
                      {item.hasSharedService && item.sharedPrice !== null
                        ? new Intl.NumberFormat('es-PE', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(item.sharedPrice)
                        : 'Por cotizar'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                    </td>
                    {kind === 'transfers' && (
                      <td className="py-3 px-4">
                        <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                    )}
                    <td className="py-3 px-4 text-right space-x-2">
                      {canEdit && (
                        <Link
                          href={`${baseRoute}?edit=${encodeURIComponent(item.id)}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-white border border-[#e5e7eb] shadow-product-card hover:bg-[#f8f9fa] rounded-md transition-colors"
                        >
                          Editar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {catalog.data.length === 0 && (
                  <tr>
                    <td colSpan={kind === 'transfers' ? 6 : 5} className="py-12 text-center text-[#898989]">
                      No hay {kind === 'tours' ? 'tours' : 'traslados'} registrados en el catálogo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {catalog.nextCursor && (
            <div className="p-3 border-t border-[#e5e7eb] flex justify-end bg-[#f8f9fa]">
              <Link
                href={`${baseRoute}?after=${encodeURIComponent(catalog.nextCursor)}`}
                className="product-button-secondary text-xs"
              >
                <span>Página siguiente</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
