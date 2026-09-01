'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@repo/ui/lib/currency';

interface DashboardChartsProps {
  revenueData: { month: string; revenue: number; orders: number }[];
  statusData: { name: string; value: number; color: string }[];
  topToursData: { title: string; count: number }[];
}

export function DashboardCharts({
  revenueData,
  statusData,
  topToursData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico Principal: Tendencia de Ingresos */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Tendencia de Ingresos</h3>
            <p className="text-xs text-slate-500">Histórico de reservas pagadas en USD</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Ingresos en Tiempo Real
          </span>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008060" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#008060" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]!.payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{data.month}</p>
                        <p className="text-emerald-400 font-bold text-sm">{formatCurrency(data.revenue)}</p>
                        <p className="text-slate-400 text-[11px]">{data.orders} reservas confirmadas</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#008060" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Circular: Distribución por Estado de Reserva */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Estado de Reservas</h3>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Proporción de reservas procesadas</p>
        </div>

        <div className="h-[180px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]!.payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
                        <span className="font-medium">{data.name}:</span> <span className="font-bold">{data.value}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
          {statusData.map((item) => (
            <div key={item.name} className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-slate-500 font-medium truncate w-full">{item.name}</span>
              <span className="text-xs font-bold text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Barras: Tours Más Demandados */}
      {topToursData.length > 0 && (
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Tours con Mayor Demanda</h3>
              <p className="text-xs text-slate-500">Cantidad de reservas acumuladas por experiencia</p>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topToursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="title" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]!.payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-xl p-2.5 shadow-xl text-xs">
                          <p className="font-semibold">{data.title}</p>
                          <p className="text-emerald-400 font-bold">{data.count} reservas</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#008060" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
