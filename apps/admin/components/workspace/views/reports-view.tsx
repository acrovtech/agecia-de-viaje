'use client';

import React from 'react';
import { PageHeader } from '../../design-system/page-header';
import { Calendar, DollarSign, TrendingUp, Layers, Compass, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface ReportsData {
  period: {
    from: string;
    to: string;
  };
  totalReservations: number;
  grossBookedValue: number;
  currency: string;
  paymentStatusBreakdown: Record<string, { count: number; total: number }>;
  bookingStatusBreakdown: Record<string, number>;
  reservationsByDay: { date: string; count: number; total: number }[];
  topTours: { title: string; count: number; total: number }[];
  sourceBreakdown: Record<string, number>;
}

export interface ReportsViewProps {
  data: ReportsData;
  from?: string;
  to?: string;
}

export function ReportsView({ data, from, to }: ReportsViewProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: data.currency || 'USD',
    }).format(amount);
  };

  const paymentStatusLabels: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PARTIAL: { label: 'Parcial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING: { label: 'Pendiente', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    REFUNDED: { label: 'Reembolsado', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    FAILED: { label: 'Fallido', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes Comerciales"
        description="Métricas consolidadas y agregados reales calculados a partir de las reservas de tu agencia."
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
          <p className="text-[11px] text-[#898989]">En el periodo consultado</p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Valor Bruto Reservado</span>
          <div className="text-2xl font-bold text-[#111111] tracking-tight">{formatMoney(data.grossBookedValue)}</div>
          <p className="text-[11px] text-[#898989]">Suma total de importes pactados</p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Pagadas / Confirmadas</span>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {data.paymentStatusBreakdown['PAID']?.count || 0}
          </div>
          <p className="text-[11px] text-[#898989]">
            {formatMoney(data.paymentStatusBreakdown['PAID']?.total || 0)} cobrados
          </p>
        </div>

        <div className="product-card-surface p-5 space-y-1">
          <span className="text-xs text-[#6b7280] font-medium block">Pagos Pendientes</span>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {data.paymentStatusBreakdown['PENDING']?.count || 0}
          </div>
          <p className="text-[11px] text-[#898989]">
            {formatMoney(data.paymentStatusBreakdown['PENDING']?.total || 0)} por cobrar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tours */}
        <div className="product-card-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111111]">Tours Más Reservados</h3>
            <p className="text-xs text-[#6b7280]">Ranking por cantidad de reservas en el periodo</p>
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
                    <span className="text-[11px] text-[#6b7280] block">{formatMoney(t.total)}</span>
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
          <h3 className="text-sm font-semibold text-[#111111]">Evolución Diaria</h3>
          <p className="text-xs text-[#6b7280]">Detalle día a día de reservas generadas</p>
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
                  <th className="py-2.5 px-4 font-medium text-right">Monto Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {data.reservationsByDay.map((day) => (
                  <tr key={day.date} className="product-data-row">
                    <td className="py-2.5 px-4 font-mono text-[#111111]">{day.date}</td>
                    <td className="py-2.5 px-4 text-center font-medium text-[#111111]">{day.count}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#111111]">{formatMoney(day.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
