import { prisma } from '@repo/db';
import { ArrowUpRight, ArrowRight, CheckCircle2, Clock, Map, BookOpen, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Cargar datos reales desde Prisma
  const toursCount = await prisma.tour.count();
  const blogsCount = await prisma.blog.count();
  
  const allReservations = await prisma.reservation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tour: true }
  });

  const paidReservations = allReservations.filter(res => res.status === 'PAID');
  const pendingReservations = allReservations.filter(res => res.status === 'PENDING');

  const totalRevenue = paidReservations.reduce((sum, res) => sum + res.totalPrice, 0);
  const totalPax = paidReservations.reduce((sum, res) => sum + res.pax, 0);
  const paidCount = paidReservations.length;
  const totalCount = allReservations.length;
  const avgTicket = paidCount > 0 ? totalRevenue / paidCount : 0;

  const recentReservations = allReservations.slice(0, 5);

  return (
    <main className="flex flex-1 flex-col gap-6">
      
      {/* Encabezado del Dashboard Shopify Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-[1.125rem] font-semibold text-[#2f2f2f] tracking-tight">Panel de Control</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link 
            href="/reservas" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-[#2f2f2f] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            Ver Reservas
          </Link>
          <Link 
            href="/tours/new" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            Crear Tour
          </Link>
        </div>
      </div>

      {/* KPI Cards Estilo Shopify Polaris (Sin Iconos Recargados, Enfocados en Métricas Financieras) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas Totales</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              USD
            </span>
          </div>
          <div className="mt-3 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
              ${totalRevenue.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            De {paidCount} {paidCount === 1 ? 'reserva pagada' : 'reservas pagadas'}
          </p>
        </div>

        {/* KPI 2: Reservas Confirmadas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reservas Pagadas</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              {totalCount} Totales
            </span>
          </div>
          <div className="mt-3 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
              {paidCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            {pendingReservations.length} pendientes de cobro
          </p>
        </div>

        {/* KPI 3: Pasajeros Totales (Pax) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pasajeros Confirmados</span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
              Pax
            </span>
          </div>
          <div className="mt-3 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
              {totalPax}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Viajeros listos para operática
          </p>
        </div>

        {/* KPI 4: Ticket Promedio (AOV) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Promedio</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              AOV
            </span>
          </div>
          <div className="mt-3 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
              ${avgTicket.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Promedio de ingreso por reserva
          </p>
        </div>

      </div>

      {/* Barra Secundaria de Estado del Catálogo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
        
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Tours en Catálogo</span>
            <span className="text-lg font-bold text-[#2f2f2f]">{toursCount} {toursCount === 1 ? 'Tour' : 'Tours'}</span>
          </div>
          <Link href="/tours" className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0">
            Gestionar <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Reservas Por Cobrar</span>
            <span className="text-lg font-bold text-[#2f2f2f]">{pendingReservations.length} {pendingReservations.length === 1 ? 'Reserva' : 'Reservas'}</span>
          </div>
          <Link href="/reservas" className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0">
            Revisar <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Blogs Publicados</span>
            <span className="text-lg font-bold text-[#2f2f2f]">{blogsCount} {blogsCount === 1 ? 'Artículo' : 'Artículos'}</span>
          </div>
          <Link href="/blogs" className="text-xs font-semibold text-[#008060] hover:text-[#006e52] hover:underline flex items-center gap-1 shrink-0">
            Ver Blogs <ArrowRight size={13} />
          </Link>
        </div>

      </div>

      {/* Tabla de Reservas Recientes Estilo Shopify */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#2f2f2f]">Reservas Recientes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Últimas transacciones y solicitudes registradas en la tienda.</p>
          </div>
          <Link 
            href="/reservas" 
            className="text-xs font-semibold text-[#008060] hover:text-[#006e52] flex items-center gap-1 hover:underline"
          >
            Ver todas las reservas <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentReservations.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-left">CLIENTE</th>
                  <th className="py-3 px-4 text-left">TOUR RESERVADO</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">FECHA VIAJE</th>
                  <th className="py-3 px-4 text-center">PASAJEROS</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">MONTO</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4 text-center">DETALLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-left">
                      <div className="font-semibold text-[#2f2f2f]">{res.customerFirstName} {res.customerLastName}</div>
                      <div className="text-[11px] text-slate-400">{res.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-left font-bold text-[#2f2f2f] uppercase truncate">
                      {res.tour?.title || 'TOUR INCA BOUND'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium whitespace-nowrap">
                      {new Date(res.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {res.pax} {res.pax === 1 ? 'Persona' : 'Personas'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#2f2f2f] whitespace-nowrap">
                      ${res.totalPrice.toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {res.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Pagado
                        </span>
                      )}
                      {res.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                      {res.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle size={12} /> Cancelado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/reservas/${res.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBEBEB] hover:bg-slate-900 hover:text-white text-[#2f2f2f] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Ver Detalle</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No hay reservas registradas en este momento.
            </div>
          )}
        </div>

      </div>

    </main>
  );
}
