import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import { DomainSubtabs } from '../domain-subtabs';
import { FleetVehicleForm } from '../../../app/workspace/operations/forms';
import type { FleetVehicleItem } from '../../../lib/reservations';

export interface VehicleTypeOption {
  id: string;
  name: string;
  maxPax: number;
}

export interface FleetViewProps {
  canMutate: boolean;
  list: {
    data: FleetVehicleItem[];
    nextCursor: string | null;
  };
  vehicleTypes: VehicleTypeOption[];
  editId?: string;
  selected?: FleetVehicleItem;
}

export function FleetView({
  canMutate,
  list,
  vehicleTypes,
  editId,
  selected,
}: FleetViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Flota Operativa (Unidades Físicas)"
        description="Vehículos físicos propios o contratados de la agencia asociados a su categoría."
        actions={
          canMutate && (
            <Link
              href="/resources/fleet?edit=new"
              className="product-button-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar unidad</span>
            </Link>
          )
        }
      />

      <DomainSubtabs domain="transfers" />

      {canMutate && (selected || editId === 'new') && (
        <div className="product-card-surface p-5 max-w-2xl">
          <FleetVehicleForm
            key={selected?.id ?? 'new'}
            vehicle={selected}
            vehicleTypes={vehicleTypes}
          />
        </div>
      )}

      <div className="product-card-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">Identificador</th>
                <th className="py-2.5 px-4 font-medium">Placa</th>
                <th className="py-2.5 px-4 font-medium">Tipo Comercial</th>
                <th className="py-2.5 px-4 font-medium">Capacidad Pax</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                {canMutate && <th className="py-2.5 px-4 font-medium text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {list.data.map((item) => (
                <tr key={item.id} className="product-data-row">
                  <td className="py-3.5 px-4 font-medium text-[#111111] text-sm">
                    {item.internalLabel}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[#111111]">
                    {item.plate}
                  </td>
                  <td className="py-3.5 px-4 text-[#374151]">{item.vehicleType.name}</td>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {item.capacity ?? item.vehicleType.maxPax} pax
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  {canMutate && (
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/resources/fleet?edit=${item.id}`}
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
                  <td colSpan={6} className="py-8 text-center text-[#898989]">
                    No hay vehículos de flota registrados aún.
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
