import { prisma } from '@repo/db';
import { Map, Calendar, Users, DollarSign, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Cargar métricas reales desde Prisma
  const toursCount = await prisma.tour.count();
  const reservationsCount = await prisma.reservation.count();
  const blogsCount = await prisma.blog.count();
  
  const recentReservations = await prisma.reservation.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: { tour: true }
  });

  const paidReservations = await prisma.reservation.findMany({
    where: { status: 'PAID' }
  });
  
  const totalRevenue = paidReservations.reduce((sum, res) => sum + res.totalPrice, 0);

  return (
    <main className="flex flex-1 flex-col gap-6">
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Ingresos Totales</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              De reservas pagadas
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tours Activos</h3>
            <Map className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{toursCount}</div>
            <p className="text-xs text-muted-foreground">
              Tours registrados en la BD
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Reservas Nuevas</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{reservationsCount}</div>
            <p className="text-xs text-muted-foreground">
              Reservas totales
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Blogs Activos</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{blogsCount}</div>
            <p className="text-xs text-muted-foreground">
              Artículos publicados
            </p>
          </div>
        </div>

      </div>

      {/* Recientes y Actividad */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Chart o Info principal */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm lg:col-span-4 p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">Rendimiento de Reservas</h3>
            <p className="text-sm text-muted-foreground">Últimos 30 días</p>
          </div>
          <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-50" />
            <span className="ml-2">Gráfico en desarrollo</span>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm lg:col-span-3 p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">Actividad Reciente</h3>
            <p className="text-sm text-muted-foreground">Últimas reservas recibidas.</p>
          </div>
          <div className="space-y-6 mt-4">
            {recentReservations.length > 0 ? (
              recentReservations.map((res) => (
                <div key={res.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{res.customerFirstName} {res.customerLastName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{res.tour.title}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-medium text-emerald-600">+${res.totalPrice.toFixed(2)}</span>
                    {res.status === 'PAID' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">No hay reservas recientes.</p>
            )}
            
            <div className="pt-2">
              <Link href="/reservas" className="text-sm text-emerald-600 hover:underline font-medium">Ver todas las reservas &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
