'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en panel de administración:', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-200/60">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Error al cargar datos del panel</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-5">
        {error.message || 'No se pudieron recuperar las métricas del sistema. Verifique su conexión y reintente.'}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
      >
        <RotateCcw size={13} /> Reintentar carga
      </button>
    </div>
  );
}
