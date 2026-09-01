'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

export interface SparklinePoint {
  label: string;
  value: number;
}

interface KpiSparklineProps {
  data: SparklinePoint[] | number[];
  color?: string; // e.g. '#008060' or '#0284c7' or '#8b5cf6' or '#d97706'
  gradientId: string;
  prefix?: string;
  decimals?: number;
}

export function KpiSparkline({
  data,
  color = '#008060',
  gradientId,
  prefix = '',
  decimals = 0,
}: KpiSparklineProps) {
  // Normalizar datos a formato { label, value }
  const chartData: SparklinePoint[] = Array.isArray(data)
    ? data.map((item, idx) => {
        if (typeof item === 'number') {
          return { label: `Punto ${idx + 1}`, value: item };
        }
        return item;
      })
    : [];

  // Si todos los valores son 0, la línea se mantendrá perfectamente horizontal en el eje 0

  return (
    <div className="h-10 w-full mt-2 -mb-1 overflow-visible relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 2, left: 2, bottom: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Tooltip interactivo idéntico a la referencia, sin línea vertical (cursor={false}) */}
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const point = payload[0]!.payload as SparklinePoint;
                const formattedVal =
                  decimals > 0
                    ? `${prefix}${point.value.toFixed(decimals)}`
                    : `${prefix}${Math.round(point.value).toLocaleString('en-US')}`;

                return (
                  <div className="bg-[#18181b] text-white px-2.5 py-1.5 rounded-lg shadow-2xl border border-white/10 text-center min-w-[72px] animate-in fade-in zoom-in-95 duration-100 z-50">
                    <p className="font-bold text-xs leading-tight tracking-tight text-white">
                      {formattedVal}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium lowercase tracking-wide mt-0.5">
                      {point.label}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            activeDot={{
              r: 3.5,
              fill: '#ffffff',
              stroke: color,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
