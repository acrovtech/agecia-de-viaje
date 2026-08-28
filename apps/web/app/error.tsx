'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Next.js Application Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA] text-gray-900">
      <Header variant="dark" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-xl mx-auto w-full">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <RefreshCw className="w-8 h-8" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-heading mb-3 tracking-tight">
          Algo no salió como esperábamos
        </h1>

        <p className="text-gray-600 text-base mb-8 leading-relaxed">
          Ha ocurrido un error inesperado al procesar la solicitud. Nuestro equipo técnico ha sido notificado.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#062918] hover:bg-[#041c10] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            <Home size={16} />
            <span>Ir al Inicio</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
