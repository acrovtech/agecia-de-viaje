import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MapPin, ArrowRight, Home, Mountain } from 'lucide-react';

function Llama404Image() {
  const llamaUrl = "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/llama-404.webp";

  return (
    <div className="relative w-56 h-56 md:w-64 md:h-64 mx-auto mb-4 flex items-center justify-center select-none">
      <div className="relative w-full h-full transform hover:scale-105 transition-transform duration-500">
        <Image
          src={llamaUrl}
          alt="Llamita Inca Bound 404"
          fill
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA] text-gray-900">
      {/* Header con estilo verde de marca (#062918) */}
      <Header variant="dark" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 text-center max-w-4xl mx-auto w-full">
        {/* Imagen de la Llamita del usuario optimizada en R2 */}
        <Llama404Image />

        {/* Número 404 Estilizado */}
        <h1 className="text-6xl md:text-8xl font-black font-heading text-[#062918] tracking-tight mb-2">
          404
        </h1>

        {/* Título Principal */}
        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 font-heading mb-3 tracking-tight">
          ¡Destino no encontrado!
        </h2>

        {/* Descripción Clara */}
        <p className="text-gray-600 text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed font-sans">
          Nuestra llamita exploradora buscó por todos los Andes, pero la ruta o página que buscas no existe o ha sido movida.
        </p>

        {/* Botones de Acción - Ancho natural, 1 sola línea */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mb-14">
          <Link
            href="/"
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#062918] hover:bg-[#041c10] text-white font-bold text-sm rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Home size={18} />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/tours"
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm rounded-xl shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Mountain size={18} className="text-[#008060]" />
            <span>Ver todos los tours</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
