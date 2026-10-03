import Link from 'next/link';
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';

export interface DispatchItem {
  reservationId: string;
  code: string | null;
  serviceTitle: string | null;
  serviceType: string | null;
  pax: number;
  operationStatus: string | null;
  pickupHotel: string | null;
  pickupTime: string | null;
  guide: { id: string; displayName: string; phone: string | null } | null;
  driver: { id: string; displayName: string; phone: string | null } | null;
  vehicle: {
    id: string;
    internalLabel: string;
    plate: string;
    vehicleTypeName: string;
    capacity?: number | null;
  } | null;
  missing: {
    guide: boolean;
    driver: boolean;
    vehicle: boolean;
    any: boolean;
  };
}

export interface OperationsDispatchViewProps {
  dispatch: {
    date: string;
    total: number;
    incomplete: number;
    data: DispatchItem[];
  };
  date: string;
  today: string;
  prevDate: string;
  nextDate: string;
  missing?: string;
}

export function OperationsDispatchView({
  dispatch,
  date,
  today,
  prevDate,
  nextDate,
  missing = '',
}: OperationsDispatchViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones y Despacho"
        description="Centro de control operativo: asignación de flota, conductores y guías para el despacho diario."
      />

      {/* Operations Sub-Navigation */}
      <div className="flex gap-2 border-b border-[#e5e7eb] pb-3">
        <Link
          href="/operations"
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#111111] text-white"
        >
          Despacho diario
        </Link>
        <Link
          href="/resources/fleet"
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]"
        >
          Flota operativa
        </Link>
        <Link
          href="/resources/personnel"
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]"
        >
          Personal operativo
        </Link>
      </div>

      <div className="space-y-5">
        {/* Dispatch Date Control Bar */}
        <div className="product-card-surface p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/operations?date=${prevDate}${missing ? `&missing=${missing}` : ''}`}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] shadow-product-card bg-white text-[#111111] hover:bg-[#f8f9fa] transition-colors"
            >
              ← Día anterior
            </Link>
            <Link
              href={`/operations?date=${today}${missing ? `&missing=${missing}` : ''}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                date === today
                  ? 'bg-[#111111] text-white'
                  : 'border border-[#e5e7eb] bg-white hover:bg-[#f8f9fa] text-[#374151]'
              }`}
            >
              Hoy
            </Link>
            <Link
              href={`/operations?date=${nextDate}${missing ? `&missing=${missing}` : ''}`}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f8f9fa] transition-colors"
            >
              Día siguiente →
            </Link>
          </div>

          <form action="/operations" method="get" className="flex items-center gap-2 text-xs">
            {missing && <input type="hidden" name="missing" value={missing} />}
            <span className="text-[#6b7280] font-medium">Fecha:</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
            />
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#242424] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Missing filters */}
        <div className="flex flex-wrap gap-2 text-xs border-b border-[#e5e7eb] pb-3">
          <Link
            href={`/operations?date=${date}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !missing
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Todos los servicios ({dispatch.total})
          </Link>
          <Link
            href={`/operations?date=${date}&missing=guide`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              missing === 'guide'
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Falta guía
          </Link>
          <Link
            href={`/operations?date=${date}&missing=driver`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              missing === 'driver'
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Falta conductor
          </Link>
          <Link
            href={`/operations?date=${date}&missing=vehicle`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              missing === 'vehicle'
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            Falta vehículo
          </Link>
        </div>

        {/* Dispatch Table */}
        <div className="product-card-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Servicio</th>
                  <th className="py-2.5 px-4 font-medium">Pax</th>
                  <th className="py-2.5 px-4 font-medium">Recojo</th>
                  <th className="py-2.5 px-4 font-medium">Guía</th>
                  <th className="py-2.5 px-4 font-medium">Conductor</th>
                  <th className="py-2.5 px-4 font-medium">Vehículo</th>
                  <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {dispatch.data.map((item) => {
                  const isFullyAssigned = !item.missing.any;
                  return (
                    <tr key={item.reservationId} className="product-data-row">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/reservations?id=${item.reservationId}`}
                          className="font-semibold text-[#111111] hover:underline"
                        >
                          {item.serviceTitle || 'Servicio'}
                        </Link>
                        <span className="block text-[11px] text-[#6b7280] font-mono">
                          {item.code || item.reservationId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#111111]">{item.pax}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#111111] font-medium">{item.pickupTime || '--:--'}</div>
                        <div className="text-[11px] text-[#6b7280] truncate max-w-[150px]">
                          {item.pickupHotel || 'No especificado'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.guide ? (
                          <span className="font-medium text-[#111111]">{item.guide.displayName}</span>
                        ) : item.missing.guide ? (
                          <span className="inline-block px-2 py-0.5 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded text-[11px] font-medium">
                            Falta guía
                          </span>
                        ) : (
                          <span className="text-[#898989] text-xs">Opcional</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.driver ? (
                          <span className="font-medium text-[#111111]">{item.driver.displayName}</span>
                        ) : item.missing.driver ? (
                          <span className="inline-block px-2 py-0.5 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded text-[11px] font-medium">
                            Falta conductor
                          </span>
                        ) : (
                          <span className="text-[#898989] text-xs">Opcional</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.vehicle ? (
                          <div>
                            <span className="font-medium text-[#111111]">{item.vehicle.internalLabel}</span>
                            <span className="block text-[11px] text-[#6b7280] font-mono">
                              [{item.vehicle.plate}]
                            </span>
                          </div>
                        ) : item.missing.vehicle ? (
                          <span className="inline-block px-2 py-0.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded text-[11px] font-medium">
                            Falta vehículo
                          </span>
                        ) : (
                          <span className="text-[#898989] text-xs">Opcional</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isFullyAssigned ? (
                          <span className="inline-flex items-center gap-1 text-[#16a34a] text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#d97706] text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Incompleto</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {dispatch.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#898989]">
                      No hay servicios operativos programados para el {date}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
