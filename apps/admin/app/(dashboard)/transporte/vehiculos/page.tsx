import { prisma, INITIAL_VEHICLES } from '@repo/db';
import Link from 'next/link';
import { 
  Car, 
  ChevronLeft, 
  Users, 
  Briefcase, 
  Plus, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VehiculosManagementPage() {
  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicleType.findMany({
      orderBy: { order: 'asc' },
    });
  } catch (err) {
    console.error('Error loading vehicles:', err);
  }

  if (!vehicles || vehicles.length === 0) {
    vehicles = INITIAL_VEHICLES.map((v: any, i: number) => ({
      id: v.code,
      code: v.code,
      name: v.name,
      subtitle: v.subtitle,
      maxPax: v.maxPax,
      maxLuggage: v.maxLuggage,
      image: v.image,
      features: v.features,
      order: v.order,
      isActive: true,
    }));
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/transporte"
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Car className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">
            Flota de Vehículos
          </h1>
          <span className="text-xs text-slate-500 font-medium">({vehicles.length})</span>
        </div>
      </div>

      {/* Grid de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {v.code}
                </div>
                <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                {v.subtitle && (
                  <p className="text-xs text-slate-500 font-medium">{v.subtitle}</p>
                )}
              </div>

              {v.image && (
                <img
                  src={v.image}
                  alt={v.name}
                  className="w-24 h-16 object-contain bg-slate-50 rounded-lg border border-slate-100 p-1 shrink-0"
                />
              )}
            </div>

            {/* Capacidades */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Hasta {v.maxPax} pasajeros</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Hasta {v.maxLuggage} maletas</span>
              </div>
            </div>

            {/* Características */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Equipamiento & Confort
              </div>
              <ul className="space-y-1">
                {v.features?.map((feat: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
