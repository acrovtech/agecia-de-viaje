import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#008060]" />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-pulse">
        Cargando panel de administración...
      </p>
    </div>
  );
}
