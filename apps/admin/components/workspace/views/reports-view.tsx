'use client';

import React from 'react';
import { PageHeader } from '../../design-system/page-header';
import { Calendar, DollarSign, TrendingUp, Layers, CheckCircle2, AlertTriangle, ArrowDownRight, ShieldAlert } from 'lucide-react';

export interface CurrencyFinancials {
  grossBookedValue: number;
  actualCollectedValue: number;
  refundedValue: number;
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
}

export interface ReportsData {
  period: {
    from: string;
    to: string;
  };
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  grossBookedValue: number;
  actualCollectedValue: number;
  refundedValue: number;
  currency: string;
  totalsByCurrency?: Record<string, CurrencyFinancials>;
  paymentStatusBreakdown: Record<string, { count: number; totalsByCurrency: Record<string, number> }>;
  bookingStatusBreakdown: Record<string, number>;
  reservationsByDay: { date: string; count: number; totalsByCurrency: Record<string, number> }[];
  topTours: { title: string; count: number }[];
  sourceBreakdown: Record<string, number>;
}

export interface ReportsViewProps {
  data: ReportsData;
  from?: string;
  to?: string;
}

export function ReportsView({ data, from, to }: ReportsViewProps) {
  const formatMoney = (amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currencyCode || data.currency || 'USD',
    }).format(amount);
  };

  const paymentStatusLabels: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIALLY_PAID: { label: 'Pago Parcial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING: { label: 'Pendiente', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    REFUND_PENDING: { label: 'Reembolso Pendiente', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    PARTIALLY_REFUNDED: { label: 'Reembolso Parcial', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    REFUNDED: { label: 'Reembolsado', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    PAYMENT_RECEIVED_REVIEW: { label: 'En Revisión', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    FAILED: { label: 'Fallido', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    EXPIRED: { label: 'Expirado', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    LEGACY_UNKNOWN: { label: 'Desconocido', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  };

  const currenciesList = Object.entries(data.totalsByCurrency || {});
  const hasMultipleCurrencies = currenciesList.length > 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes Comerciales"
        description="Métricas consolidadas y agregados reales calculados a partir de las reservas registradas de tu agencia."
      />

      {/* Date Range Filter Bar */}
      <form method="GET" action="/reports" className="product-card-surface p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#6b7280]" />
          <span className="font-semibold text-[#111111]">Periodo:</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-from" className="text-[#6b7280]">Desde:</label>
          <input
            id="report-from"
            type="date"
            name="from"
            defaultValue={from || data.period.from.slice(0, 10)}
            className="h-8 rounded-lg border border-[#e5e7eb] px-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-to" className="text-[#6b7280]">Hasta:</label>
          <input
            id="report-to"
            type="date"
            name="to"
            defaultValue={to || data.period.to.slice(0, 10)}
            className="h-8 rounded-lg border border-[#e5e7eb] px-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>
        <span className="text-[11px] text-[#6b7280] hidden md:inline-block">
          (Reservas registradas durante el periodo)
        </span>
        <button
          type="submit"
          className="product-button-primary py-1 px-3 text-xs ml-auto"
        >
          Aplicar filtro
        </button>
      </form>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Total Reservas</span>
          <div className="text-2xl font-bold text-[#111111] tracking-tight">{data.totalReservations}</div>
          <p className="text-[11px] text-[#898989]">
            {data.activeReservations} activas · {data.cancelledReservations} canceladas
          </p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Valor Bruto Reservado</span>
          <div className="text-2xl font-bold text-[#111111] tracking-tight">{formatMoney(data.grossBookedValue)}</div>
          <p className="text-[11px] text-[#898989]">Excluye reservas canceladas</p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Valor Cobrado Real</span>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {formatMoney(data.actualCollectedValue)}
          </div>
          <p className="text-[11px] text-[#898989]">
            Neto efectivamente percibido
          </p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Total Reembolsos</span>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {formatMoney(data.refundedValue)}
          </div>
          <p className="text-[11px] text-[#898989]">
            Importes devueltos a clientes
          </p>
        </div>
      </div>

      {/* Multi-Currency Breakdown if multiple currencies exist */}
      {hasMultipleCurrencies && (
        <div className="product-card-surface p-5 space-y-3">
          <div className="border-b border-[#e5e7eb] pb-2">
            <h3 className="text-sm font-semibold text-[#111111]">Totales Aislados por Moneda</h3>
            <p className="text-xs text-[#6b7280]">
              Cada divisa se totaliza de forma independiente para evitar sumas distorsionadas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {currenciesList.map(([curr, fin]) => (
              <div key={curr} className="p-3.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-sm text-[#111111]">
                  <span>{curr}</span>
                  <span className="text-xs font-normal text-[#6b7280]">{fin.totalReservations} reservas</span>
                </div>
                <div className="flex justify-between text-[#6b7280] pt-1">
                  <span>Bruto Reservado:</span>
                  <span className="font-semibold text-[#111111]">{formatMoney(fin.grossBookedValue, curr)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>Cobrado Real:</span>
                  <span className="font-semibold text-emerald-600">{formatMoney(fin.actualCollectedValue, curr)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>Reembolsado:</span>
                  <span className="font-semibold text-rose-600">{formatMoney(fin.refundedValue, curr)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status Breakdown */}
      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">Estado de Pagos</h3>
          <p className="text-xs text-[#6b7280]">Desglose de reservas según estado de cobranza registrado</p>
        </div>

        {Object.keys(data.paymentStatusBreakdown).length === 0 ? (
          <p className="text-xs text-[#6b7280] py-2 text-center">No hay registros de pago en este periodo.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(data.paymentStatusBreakdown).map(([statusKey, info]) => {
              const meta = paymentStatusLabels[statusKey] || {
                label: statusKey,
                color: 'bg-slate-100 text-slate-700 border-slate-200',
              };
              const currencyEntries = Object.entries(info.totalsByCurrency || {});
              return (
                <div key={statusKey} className="p-3 rounded-lg border border-[#e5e7eb] space-y-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="text-lg font-bold text-[#111111]">{info.count}</div>
                  <div className="space-y-0.5">
                    {currencyEntries.length > 0 ? (
                      currencyEntries.map(([curr, amt]) => (
                        <span key={curr} className="text-[11px] text-[#6b7280] block truncate">
                          {formatMoney(amt, curr)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#6b7280] block">$0.00</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tours */}
        <div className="product-card-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Tours Más Reservados</h3>
            <p className="text-xs text-[#6b7280]">Ranking por cantidad de reservas registradas en el periodo</p>
          </div>

          {data.topTours.length === 0 ? (
            <p className="text-xs text-[#6b7280] py-4 text-center">No hay reservas registradas en este periodo.</p>
          ) : (
            <div className="divide-y divide-[#e5e7eb] text-xs">
              {data.topTours.map((t, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[#111111] truncate">{t.title}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-[#111111]">{t.count} res.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source / Channel Breakdown */}
        <div className="product-card-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Canales de Venta / Origen</h3>
            <p className="text-xs text-[#6b7280]">Distribución por procedencia de la reserva</p>
          </div>

          {Object.keys(data.sourceBreakdown).length === 0 ? (
            <p className="text-xs text-[#6b7280] py-4 text-center">No hay datos de canales para este periodo.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {Object.entries(data.sourceBreakdown).map(([channel, count]) => {
                const percent = data.totalReservations > 0 ? Math.round((count / data.totalReservations) * 100) : 0;
                return (
                  <div key={channel} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#111111]">{channel}</span>
                      <span className="text-[#6b7280]">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#111111] h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="product-card-surface space-y-3">
        <div className="p-5 border-b border-[#e5e7eb]">
          <h3 className="text-sm font-semibold text-[#111111]">Evolución Diaria de Ventas</h3>
          <p className="text-xs text-[#6b7280]">
            Reservas registradas durante el periodo (Fecha de registro de venta comercial)
          </p>
        </div>

        {data.reservationsByDay.length === 0 ? (
          <p className="text-xs text-[#6b7280] p-6 text-center">No hay actividad en el rango seleccionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Fecha</th>
                  <th className="py-2.5 px-4 font-medium text-center">Cantidad Reservas</th>
                  <th className="py-2.5 px-4 font-medium text-right">Monto por Moneda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {data.reservationsByDay.map((day) => {
                  const dayCurrs = Object.entries(day.totalsByCurrency || {});
                  return (
                    <tr key={day.date} className="product-data-row">
                      <td className="py-2.5 px-4 font-mono text-[#111111]">{day.date}</td>
                      <td className="py-2.5 px-4 text-center font-medium text-[#111111]">{day.count}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#111111]">
                        {dayCurrs.length > 0
                          ? dayCurrs.map(([curr, amt]) => formatMoney(amt, curr)).join(' · ')
                          : '$0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
