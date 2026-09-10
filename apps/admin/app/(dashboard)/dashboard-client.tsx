'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  Compass,
  Car,
  XCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  eachDayOfInterval,
  differenceInCalendarDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { KpiSparkline, SparklinePoint } from '@/components/dashboard/kpi-sparkline';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Reservation, Tour, Transfer, VehicleType } from '@repo/db';

export type ReservationWithRelations = Reservation & {
  tour: Tour | null;
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
};

interface DashboardClientProps {
  initialReservations: ReservationWithRelations[];
  toursCount: number;
  blogsCount: number;
}

export function DashboardClient({
  initialReservations,
  toursCount,
  blogsCount,
}: DashboardClientProps) {
  // Rango de fechas por defecto: Últimos 7 días
  const [startDate, setStartDate] = useState(() =>
    format(subDays(new Date(), 6), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );

  // Filtrar reservas que caen dentro del período seleccionado (por fecha de creación)
  const filteredReservations = useMemo(() => {
    if (!startDate && !endDate) {
      return initialReservations;
    }

    const start = startDate ? startOfDay(parseISO(startDate)).getTime() : -Infinity;
    const end = endDate ? endOfDay(parseISO(endDate)).getTime() : Infinity;

    return initialReservations.filter((r) => {
      const createdTime = new Date(r.createdAt).getTime();
      return createdTime >= start && createdTime <= end;
    });
  }, [initialReservations, startDate, endDate]);

  // Métricas agregadas del período
  const metrics = useMemo(() => {
    const paid = filteredReservations.filter((r) => r.status === 'PAID');
    const pending = filteredReservations.filter((r) => r.status === 'PENDING');
    const cancelled = filteredReservations.filter((r) => r.status === 'CANCELLED');

    const totalRevenue = paid.reduce((sum, r) => sum + r.totalPrice, 0);
    const paidCount = paid.length;
    const totalCount = filteredReservations.length;
    const pendingCount = pending.length;
    const totalPax = paid.reduce((sum, r) => sum + r.pax, 0);
    const avgTicket = paidCount > 0 ? totalRevenue / paidCount : 0;

    return {
      paid,
      pending,
      cancelled,
      totalRevenue,
      paidCount,
      totalCount,
      pendingCount,
      totalPax,
      avgTicket,
    };
  }, [filteredReservations]);

  // Generar puntos para los Sparklines según el período seleccionado
  const sparklines = useMemo(() => {
    const revenueData: SparklinePoint[] = [];
    const paidData: SparklinePoint[] = [];
    const paxData: SparklinePoint[] = [];
    const aovData: SparklinePoint[] = [];

    // Si hay rango definido
    if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate));
      const end = startOfDay(parseISO(endDate));
      const diffDays = differenceInCalendarDays(end, start);

      if (diffDays <= 0) {
        // Mismo día (Hoy o 1 día): 2 puntos para que Recharts dibuje línea continua
        const label = format(start, 'd MMM', { locale: es });
        revenueData.push({ label: `${label} (Inicio)`, value: 0 }, { label, value: metrics.totalRevenue });
        paidData.push({ label: `${label} (Inicio)`, value: 0 }, { label, value: metrics.paidCount });
        paxData.push({ label: `${label} (Inicio)`, value: 0 }, { label, value: metrics.totalPax });
        aovData.push({ label: `${label} (Inicio)`, value: 0 }, { label, value: metrics.avgTicket });
      } else if (diffDays <= 31) {
        // Hasta 31 días: generar día a día
        const days = eachDayOfInterval({ start, end });
        days.forEach((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const label = format(day, 'd MMM', { locale: es });

          const dayPaid = metrics.paid.filter(
            (r) => format(new Date(r.createdAt), 'yyyy-MM-dd') === dateStr
          );

          const rev = dayPaid.reduce((sum, r) => sum + r.totalPrice, 0);
          const count = dayPaid.length;
          const pax = dayPaid.reduce((sum, r) => sum + r.pax, 0);
          const aov = count > 0 ? rev / count : 0;

          revenueData.push({ label, value: rev });
          paidData.push({ label, value: count });
          paxData.push({ label, value: pax });
          aovData.push({ label, value: aov });
        });
      } else {
        // Más de 31 días: generar buckets de semanas o días distribuidos
        const days = eachDayOfInterval({ start, end });
        // Tomar ~20 puntos distribuidos
        const step = Math.ceil(days.length / 20);
        for (let i = 0; i < days.length; i += step) {
          const chunk = days.slice(i, i + step);
          const label = format(chunk[0]!, 'd MMM', { locale: es });
          const dateSet = new Set(chunk.map((d) => format(d, 'yyyy-MM-dd')));

          const chunkPaid = metrics.paid.filter((r) =>
            dateSet.has(format(new Date(r.createdAt), 'yyyy-MM-dd'))
          );

          const rev = chunkPaid.reduce((sum, r) => sum + r.totalPrice, 0);
          const count = chunkPaid.length;
          const pax = chunkPaid.reduce((sum, r) => sum + r.pax, 0);
          const aov = count > 0 ? rev / count : 0;

          revenueData.push({ label, value: rev });
          paidData.push({ label, value: count });
          paxData.push({ label, value: pax });
          aovData.push({ label, value: aov });
        }
      }
    } else {
      // Todo el histórico: últimos 7 días como fallback
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const label = format(d, 'd MMM', { locale: es });

        const dayPaid = metrics.paid.filter(
          (r) => format(new Date(r.createdAt), 'yyyy-MM-dd') === dateStr
        );

        const rev = dayPaid.reduce((sum, r) => sum + r.totalPrice, 0);
        const count = dayPaid.length;
        const pax = dayPaid.reduce((sum, r) => sum + r.pax, 0);
        const aov = count > 0 ? rev / count : 0;

        revenueData.push({ label, value: rev });
        paidData.push({ label, value: count });
        paxData.push({ label, value: pax });
        aovData.push({ label, value: aov });
      }
    }

    return { revenueData, paidData, paxData, aovData };
  }, [startDate, endDate, metrics]);

  // Últimas reservas a mostrar en la tabla del dashboard (siempre las 5 más recientes, independientes del filtro de fechas)
  const recentReservations = useMemo(() => {
    return initialReservations.slice(0, 5);
  }, [initialReservations]);

  return (
    <main className="flex flex-1 flex-col gap-6 font-sans select-none">
      {/* 1. Encabezado del Dashboard: Título a la izquierda, Filtro de Fechas + Botón Crear a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[1.125rem] font-semibold text-[#2f2f2f] tracking-tight">
            Panel de Control
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Selector de Rango de Fechas Integrado (Shopify Polaris) */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onApply={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
          />

          <Link
            href="/tours/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Crear Tour</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards con Sparklines Reactivos a las Fechas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ventas Totales
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                USD
              </span>
            </div>
            <div className="mt-3 mb-1">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                ${metrics.totalRevenue.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              De {metrics.paidCount} {metrics.paidCount === 1 ? 'reserva pagada' : 'reservas pagadas'}
            </p>
          </div>
          <KpiSparkline
            color="#008060"
            gradientId="sparkline-rev"
            data={sparklines.revenueData}
            prefix="$"
            decimals={0}
          />
        </div>

        {/* KPI 2: Reservas Confirmadas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Reservas Pagadas
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                {metrics.totalCount} Totales
              </span>
            </div>
            <div className="mt-3 mb-1">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.paidCount}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {metrics.pendingCount} pendientes de cobro
            </p>
          </div>
          <KpiSparkline
            color="#0284c7"
            gradientId="sparkline-paid"
            data={sparklines.paidData}
            decimals={0}
          />
        </div>

        {/* KPI 3: Pasajeros Totales (Pax) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pasajeros Confirmados
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                PAX
              </span>
            </div>
            <div className="mt-3 mb-1">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.totalPax}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Viajeros en el período
            </p>
          </div>
          <KpiSparkline
            color="#8b5cf6"
            gradientId="sparkline-pax"
            data={sparklines.paxData}
            decimals={0}
          />
        </div>

        {/* KPI 4: Ticket Promedio (AOV) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ticket Promedio
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                AOV
              </span>
            </div>
            <div className="mt-3 mb-1">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                ${metrics.avgTicket.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Promedio de ingreso por reserva
            </p>
          </div>
          <KpiSparkline
            color="#d97706"
            gradientId="sparkline-avg"
            data={sparklines.aovData}
            prefix="$"
            decimals={0}
          />
        </div>
      </div>

      {/* 3. Barra Secundaria de Estado del Catálogo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Tours en Catálogo
            </span>
            <span className="text-lg font-bold text-[#2f2f2f]">
              {toursCount} {toursCount === 1 ? 'Tour' : 'Tours'}
            </span>
          </div>
          <Link
            href="/tours"
            className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0"
          >
            Gestionar <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Reservas Por Cobrar
            </span>
            <span className="text-lg font-bold text-[#2f2f2f]">
              {metrics.pendingCount} {metrics.pendingCount === 1 ? 'Reserva' : 'Reservas'}
            </span>
          </div>
          <Link
            href="/reservas"
            className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0"
          >
            Revisar <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Blogs Publicados
            </span>
            <span className="text-lg font-bold text-[#2f2f2f]">
              {blogsCount} {blogsCount === 1 ? 'Artículo' : 'Artículos'}
            </span>
          </div>
          <Link
            href="/blogs"
            className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0"
          >
            Ver Blogs <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 4. Tabla de Últimas Reservas Estilo Shopify (Siempre muestra las más recientes) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#2f2f2f]">
              Últimas Reservas
            </h2>
          </div>
          <Link
            href="/reservas"
            className="text-xs font-semibold text-[#008060] hover:text-[#006e52] flex items-center gap-1 hover:underline"
          >
            Ver todas las reservas <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentReservations.length > 0 ? (
          <>
            {/* VISTA DESKTOP: TABLA COMPLETA NORMALIZADA SEGÚN TAB DE RESERVAS */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[26%]" />
                  <col className="w-[12%]" />
                  <col className="w-[6%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Servicio Reservado</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Fecha Viaje</th>
                    <th className="px-4 py-3 text-center">PAX</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {recentReservations.map((res) => {
                    const serviceTitle = res.tour ? res.tour.title : res.transfer ? res.transfer.title : 'RESERVA INCA BOUND';
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-left">
                          <div className="font-semibold text-slate-900 truncate">
                            {res.customerFirstName} {res.customerLastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {res.customerEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left font-semibold text-slate-900">
                          <div className="font-bold text-slate-900 uppercase line-clamp-1 text-xs" title={serviceTitle}>
                            {serviceTitle}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap text-xs font-semibold">
                          {new Date(res.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-700">
                          {res.pax}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          ${res.totalPrice.toFixed(2)} USD
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {res.tour ? (
                            <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              <Compass size={12} className="shrink-0 text-teal-600" />
                              <span>Tour</span>
                            </span>
                          ) : res.transfer ? (
                            <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Car size={12} className="shrink-0 text-sky-600" />
                              <span>Traslado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                              <span>General</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {res.status === 'PAID' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> <span>Pagado</span>
                            </span>
                          )}
                          {res.status === 'PENDING' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} /> <span>Pendiente</span>
                            </span>
                          )}
                          {res.status === 'CANCELLED' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} /> <span>Cancelado</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/reservas/${res.id}`}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ver detalle"
                            >
                              <span>Ver detalle</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MOBILE: CARDS COMPACTAS NORMALIZADAS */}
            <div className="md:hidden divide-y divide-slate-100">
              {recentReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2f2f2f] text-xs truncate">
                      {res.customerFirstName} {res.customerLastName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                      {res.customerEmail}
                    </div>
                  </div>
                  <Link
                    href={`/reservas/${res.id}`}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    title="Ver detalle"
                  >
                    <span>Ver detalle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No hay reservas registradas en este momento.
          </div>
        )}
      </div>
    </main>
  );
}
