import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import type { NavIdentity } from '../../design-system/sidebar';

export interface DashboardViewProps {
  identity: NavIdentity;
  reservations: {
    id: string;
    code: string | null;
    serviceTitle: string | null;
    date: string;
    pax: number;
    totalPrice: number;
    totalMinor?: number | null;
    currency: string;
    operationStatus: string | null;
    customerFirstName: string;
    customerLastName: string;
  }[];
  dispatchTotal: number;
  dispatchIncomplete: number;
  reservationsToday: number;
  pendingReservations: number;
  formattedBookedValue: string;
}

export function DashboardView({
  identity,
  reservations,
  dispatchTotal,
  dispatchIncomplete,
  reservationsToday,
  pendingReservations,
  formattedBookedValue,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description={`Resumen operativo de ${identity.agencyName}`}
        actions={
          <Link
            href="/reservations?new=1"
            className="product-button-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva reserva</span>
          </Link>
        }
      />

      {/* Live Email Transport Quiet System Notice */}
      <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#374151]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#898989] shrink-0" aria-hidden="true" />
          <span className="font-medium truncate">
            Correo transaccional pendiente de configurar
          </span>
          <span className="hidden sm:inline text-[#6b7280]">
            — Outbox duradero y cifrado activo (LIVE EMAIL TRANSPORT: NOT CONFIGURED)
          </span>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-medium text-[#111111] hover:underline underline-offset-2 shrink-0 ml-3"
        >
          Ver outbox
        </Link>
      </div>

      {/* Flat Operational Metrics Row (Whitespace + Typography + Hairline Divider) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-3 border-b border-[#e5e7eb]">
        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Servicios hoy</span>
          <div className="text-2xl font-semibold text-[#111111] tracking-tight">{reservationsToday}</div>
          <p className="text-[11px] text-[#6b7280]">
            {dispatchTotal === 0 ? 'Sin servicios programados' : `${dispatchTotal} programados en despacho`}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Operaciones pendientes</span>
          <div className="text-2xl font-semibold text-[#111111] tracking-tight">{dispatchIncomplete}</div>
          <p className="text-[11px] text-[#6b7280]">
            {dispatchIncomplete > 0 ? 'Falta asignar recursos' : 'Despacho completo'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Reservas pendientes</span>
          <div className="text-2xl font-semibold text-[#111111] tracking-tight">{pendingReservations}</div>
          <p className="text-[11px] text-[#6b7280]">Pendientes de coordinar</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6b7280] font-medium block">Valor reservado</span>
            <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
              Frozen
            </span>
          </div>
          <div className="text-2xl font-semibold text-[#111111] tracking-tight">{formattedBookedValue}</div>
          <p className="text-[11px] text-[#898989]">
            Importe pactado (pagos diferidos)
          </p>
        </div>
      </div>

      {/* Recent Reservations Snapshot (Canonical Grouped List Container) */}
      <div className="product-card-surface">
        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Reservas Recientes</h3>
            <p className="text-xs text-[#6b7280]">Últimos servicios registrados en tu agencia</p>
          </div>
          <Link
            href="/reservations"
            className="text-xs font-medium text-[#111111] hover:underline underline-offset-2"
          >
            Ver todas
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">Código</th>
                <th className="py-2.5 px-4 font-medium">Servicio</th>
                <th className="py-2.5 px-4 font-medium">Cliente</th>
                <th className="py-2.5 px-4 font-medium">Fecha</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                <th className="py-2.5 px-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {reservations.slice(0, 5).map((row) => (
                <tr key={row.id} className="product-data-row">
                  <td className="py-3 px-4 font-semibold text-[#111111]">
                    <Link
                      href={`/reservations?id=${row.id}`}
                      className="hover:underline font-mono"
                    >
                      {row.code ?? row.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[#111111] font-medium">
                    {row.serviceTitle ?? 'Servicio'}
                  </td>
                  <td className="py-3 px-4 text-[#374151]">
                    {row.customerFirstName} {row.customerLastName}
                  </td>
                  <td className="py-3 px-4 text-[#6b7280]">{row.date.slice(0, 10)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={row.operationStatus || 'PENDING'} />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#111111]">
                    ${((row.totalMinor ?? Math.round(row.totalPrice * 100)) / 100).toFixed(2)} USD
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#898989]">
                    No hay reservas todavía
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
