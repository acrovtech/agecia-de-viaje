import React from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Calendar, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import type { NavIdentity } from '../../design-system/sidebar';

export interface DashboardReservation {
  id: string;
  code: string | null;
  serviceTitle: string | null;
  date: string;
  pax: number;
  totalPrice: number;
  totalMinor?: number | null;
  currency: string;
  bookingStatus?: string | null;
  paymentStatus?: string | null;
  operationStatus?: string | null;
  customerFirstName: string;
  customerLastName: string;
  pickupHotel?: string | null;
}

export interface DashboardViewProps {
  identity: NavIdentity;
  reservationsToday: number;
  upcomingReservations: DashboardReservation[];
  attentionNeeded: {
    reservation: DashboardReservation;
    reason: string;
  }[];
  nextDaysLoad: { date: string; dayName: string; count: number }[];
  formattedBookedValue?: string;
  totalsByCurrency?: Record<string, number>;
  totalReservationsCount: number;
}

export function DashboardView({
  identity,
  reservationsToday,
  upcomingReservations,
  attentionNeeded,
  nextDaysLoad,
  formattedBookedValue,
  totalsByCurrency,
  totalReservationsCount,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description={`Panel operativo y comercial de ${identity.agencyName}`}
        actions={
          <Link
            href="/catalog/tours?edit=new"
            className="product-button-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo tour</span>
          </Link>
        }
      />

      {/* Action-Oriented Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-b border-[#e5e7eb]">
        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Servicios Hoy</span>
          <div className="text-2xl font-bold text-[#111111] tracking-tight">{reservationsToday}</div>
          <p className="text-[11px] text-[#6b7280]">
            {reservationsToday === 0 ? 'Sin salidas programadas hoy' : `${reservationsToday} reservas para hoy`}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Requieren Atención</span>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">{attentionNeeded.length}</div>
          <p className="text-[11px] text-[#6b7280]">
            {attentionNeeded.length === 0 ? 'Todo al día' : 'Pendientes de confirmar o cobrar'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Próximas Salidas</span>
          <div className="text-2xl font-bold text-[#111111] tracking-tight">{upcomingReservations.length}</div>
          <p className="text-[11px] text-[#6b7280]">Próximas reservas cronológicas</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6b7280] font-medium block">Valor Reservado</span>
            <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
              Total
            </span>
          </div>
          {totalsByCurrency && Object.keys(totalsByCurrency).length > 0 ? (
            <div className="space-y-0.5">
              {Object.entries(totalsByCurrency).map(([curr, amt]) => (
                <div key={curr} className="text-xl font-bold text-[#111111] tracking-tight">
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: curr }).format(amt)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-2xl font-bold text-[#111111] tracking-tight">
              {formattedBookedValue || '$0.00'}
            </div>
          )}
          <p className="text-[11px] text-[#898989]">{totalReservationsCount} reservas registradas</p>
        </div>
      </div>

      {/* SECTION: REQUIEREN ATENCIÓN */}
      {attentionNeeded.length > 0 && (
        <div className="product-card-surface border-amber-200 bg-amber-50/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-[#111111]">Requieren Atención</h3>
            </div>
            <Link href="/reservations" className="text-xs font-medium text-amber-800 hover:underline">
              Ir a Reservas
            </Link>
          </div>

          <div className="divide-y divide-amber-100 text-xs">
            {attentionNeeded.slice(0, 4).map(({ reservation: r, reason }) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reservations?id=${r.id}`}
                      className="font-semibold text-[#111111] hover:underline font-mono"
                    >
                      {r.code ?? r.id.slice(0, 8)}
                    </Link>
                    <span className="text-[#374151] truncate">— {r.serviceTitle ?? 'Tour'}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">{reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-[#111111]">
                    ${((r.totalMinor ?? Math.round(r.totalPrice * 100)) / 100).toFixed(2)} USD
                  </span>
                  <Link
                    href={`/reservations?id=${r.id}`}
                    className="block text-[11px] text-[#111111] font-medium hover:underline mt-0.5"
                  >
                    Gestionar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: PRÓXIMOS DÍAS (Carga operativa) */}
      <div className="product-card-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Carga de los Próximos 7 Días</h3>
            <p className="text-xs text-[#6b7280]">Volumen de pasajeros y servicios programados</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {nextDaysLoad.map((item, idx) => (
            <div
              key={item.date}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                idx === 0
                  ? 'border-[#111111] bg-[#f8f9fa] shadow-xs'
                  : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#6b7280] block">
                {item.dayName}
              </span>
              <span className="text-xs font-mono text-[#898989] block mt-0.5">
                {item.date.slice(5)}
              </span>
              <div className="mt-2 text-base font-bold text-[#111111]">{item.count}</div>
              <span className="text-[10px] text-[#898989] block">
                {item.count === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: PRÓXIMAS RESERVAS */}
      <div className="product-card-surface">
        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Próximas Reservas</h3>
            <p className="text-xs text-[#6b7280]">Siguientes salidas ordenadas cronológicamente</p>
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
                <th className="py-2.5 px-4 font-medium">Tour</th>
                <th className="py-2.5 px-4 font-medium">Cliente</th>
                <th className="py-2.5 px-4 font-medium">Fecha</th>
                <th className="py-2.5 px-4 font-medium text-center">Pax</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                <th className="py-2.5 px-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {upcomingReservations.slice(0, 6).map((row) => (
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
                    {row.serviceTitle ?? 'Tour'}
                  </td>
                  <td className="py-3 px-4 text-[#374151]">
                    {row.customerFirstName} {row.customerLastName}
                  </td>
                  <td className="py-3 px-4 text-[#6b7280]">{row.date.slice(0, 10)}</td>
                  <td className="py-3 px-4 text-center font-medium text-[#111111]">
                    {row.pax}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={row.operationStatus || row.bookingStatus || 'PENDING'} />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#111111]">
                    ${((row.totalMinor ?? Math.round(row.totalPrice * 100)) / 100).toFixed(2)} USD
                  </td>
                </tr>
              ))}
              {upcomingReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#898989]">
                    No hay reservas programadas próximamente
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
