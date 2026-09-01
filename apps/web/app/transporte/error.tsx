'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function TransporteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en sección de transporte:', error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header variant="dark" />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[50vh] px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No pudimos cargar los traslados</h2>
        <p className="text-sm text-gray-600 max-w-md mb-6">
          Ocurrió un inconveniente al consultar las tarifas de transporte turístico. Puedes reintentar la solicitud.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#062918] text-white rounded-xl text-xs font-semibold hover:bg-[#0c4028] transition-colors cursor-pointer"
          >
            <RotateCcw size={14} /> Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Home size={14} /> Ir al Inicio
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
