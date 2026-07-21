import { Map, Calendar, Users, DollarSign, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Aquí puedes cargar métricas reales desde Prisma. Por ahora usamos datos estáticos para diseño.
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
            <div className="text-2xl font-bold">$14,231.00</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 text-emerald-500">
              <ArrowUpRight className="h-3 w-3" />
              +20.1% respecto al mes pasado
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tours Activos</h3>
            <Map className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">
              4 nuevos publicados este mes
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Reservas Nuevas</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">+48</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 text-emerald-500">
              <ArrowUpRight className="h-3 w-3" />
              +12% esta semana
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Clientes Activos</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 usuarios únicos desde enero
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
          <div className="space-y-8 mt-4">
            {/* Lista mock */}
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">María González</p>
                <p className="text-sm text-muted-foreground">maria.g@email.com</p>
              </div>
              <div className="ml-auto font-medium text-emerald-500">+$299.00</div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">Carlos Silva</p>
                <p className="text-sm text-muted-foreground">csilva@email.com</p>
              </div>
              <div className="ml-auto font-medium text-emerald-500">+$150.00</div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">Elena Torres</p>
                <p className="text-sm text-muted-foreground">etorres@email.com</p>
              </div>
              <div className="ml-auto font-medium text-emerald-500">+$450.00</div>
            </div>
            
            <div className="pt-4">
              <Link href="#" className="text-sm text-primary hover:underline">Ver todas las reservas &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
