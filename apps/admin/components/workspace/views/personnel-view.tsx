import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import { ServiceResourceForm } from '../../../app/workspace/operations/forms';
import type { ServiceResourceItem } from '../../../lib/reservations';

export interface PersonnelViewProps {
  canMutate: boolean;
  list: {
    data: ServiceResourceItem[];
    nextCursor: string | null;
  };
  editId?: string;
  selected?: ServiceResourceItem;
}

export function PersonnelView({
  canMutate,
  list,
  editId,
  selected,
}: PersonnelViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Operativo"
        description="Guías oficiales y conductores asignables a los servicios de tu agencia."
        actions={
          canMutate && (
            <Link
              href="/resources/personnel?edit=new"
              className="product-button-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar colaborador</span>
            </Link>
          )
        }
      />

      {canMutate && (selected || editId === 'new') && (
        <div className="product-card-surface p-5 max-w-2xl">
          <ServiceResourceForm key={selected?.id ?? 'new'} resource={selected} />
        </div>
      )}

      <div className="product-card-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">Nombre</th>
                <th className="py-2.5 px-4 font-medium">Rol Operativo</th>
                <th className="py-2.5 px-4 font-medium">Teléfono</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                {canMutate && <th className="py-2.5 px-4 font-medium text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {list.data.map((item) => (
                <tr key={item.id} className="product-data-row">
                  <td className="py-3.5 px-4 font-medium text-[#111111] text-sm">
                    {item.displayName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-[#374151]">
                      {item.type === 'GUIDE' ? 'Guía de Turismo' : 'Conductor'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#6b7280]">
                    {item.phone || 'Sin registrar'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  {canMutate && (
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/resources/personnel?edit=${item.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                      >
                        Editar
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
              {list.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#898989]">
                    No hay personal operativo registrado en tu agencia aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
