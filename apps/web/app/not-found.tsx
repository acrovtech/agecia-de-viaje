import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="bg-white p-10 md:p-14 rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-[#062918]/10 text-[#062918] rounded-full flex items-center justify-center mb-6">
            <Compass size={44} className="animate-spin-slow" />
          </div>
          
          <h1 className="text-6xl font-extrabold text-[#062918] mb-3">404</h1>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Destino no encontrado</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            La experiencia o ruta que buscas no existe o ha sido movida. Explora nuestras expediciones disponibles para continuar tu aventura.
          </p>

          <Link
            href="/tours"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#062918] hover:bg-[#041c10] text-white font-semibold text-sm rounded-xl shadow-lg transition-all duration-200 w-full"
          >
            <ArrowLeft size={18} />
            <span>Ver todos los tours</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
