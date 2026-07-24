import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Compass, MapPin, ArrowRight, Home, Mountain, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#04190F] text-white">
      {/* Header con variante oscura (color del footer #062918) */}
      <Header variant="dark" />

      <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-4 py-16 md:py-24">
        {/* Glow & Background Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#008060]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl w-full text-center flex flex-col items-center">
          
          {/* Animated SVG & Compass Badge */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Outer Glowing Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2dd4bf]/30 to-[#008060]/40 blur-xl animate-pulse" />
            
            {/* SVG Compass Composite Frame */}
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#062918] border-2 border-[#2dd4bf]/40 flex items-center justify-center shadow-2xl backdrop-blur-md group">
              <svg 
                className="w-16 h-16 md:w-20 md:h-20 text-[#2dd4bf] animate-spin-slow" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
              </svg>
              
              <Compass className="w-10 h-10 md:w-12 md:h-12 text-amber-300 absolute transform transition-transform duration-700 hover:rotate-45" />
              <Sparkles className="w-5 h-5 text-[#2dd4bf] absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>

          {/* 404 Stylized Gradient Text */}
          <h1 className="text-7xl md:text-9xl font-black font-heading tracking-wider bg-gradient-to-r from-emerald-400 via-[#2dd4bf] to-amber-300 bg-clip-text text-transparent drop-shadow-2xl mb-2">
            404
          </h1>

          {/* Headline & Description */}
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-white mb-4">
            ¡Te has salido del camino Inca!
          </h2>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-sans">
            La experiencia o expedición que buscas no existe o ha sido movida a un nuevo destino. ¡No te preocupes, la aventura continúa!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#008060] to-[#065f46] hover:from-[#009b75] hover:to-[#044e39] text-white font-semibold text-sm rounded-full shadow-xl shadow-[#008060]/20 hover:shadow-[#008060]/40 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Home size={18} />
              <span>Volver al Inicio</span>
            </Link>

            <Link
              href="/tours"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-full backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Mountain size={18} className="text-[#2dd4bf]" />
              <span>Explorar Tours</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick Recommendations Header */}
          <div className="w-full border-t border-white/10 pt-10">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-6 flex items-center justify-center gap-2">
              <MapPin size={14} />
              <span>Destinos Recomendados para Ti</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <Link 
                href="/tours/machu-picchu-full-day"
                className="group p-4 bg-[#062918]/80 hover:bg-[#062918] border border-white/10 hover:border-[#2dd4bf]/50 rounded-2xl transition-all duration-300 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#2dd4bf] transition-colors">Machu Picchu</h4>
                  <p className="text-xs text-gray-400">Full Day Express</p>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-[#2dd4bf] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                href="/tours/camino-inca-4-dias"
                className="group p-4 bg-[#062918]/80 hover:bg-[#062918] border border-white/10 hover:border-[#2dd4bf]/50 rounded-2xl transition-all duration-300 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#2dd4bf] transition-colors">Camino Inca clásico</h4>
                  <p className="text-xs text-gray-400">4 Días / 3 Noches</p>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-[#2dd4bf] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                href="/tours/montana-de-7-colores"
                className="group p-4 bg-[#062918]/80 hover:bg-[#062918] border border-white/10 hover:border-[#2dd4bf]/50 rounded-2xl transition-all duration-300 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-white group-hover:text-[#2dd4bf] transition-colors">Montaña de 7 Colores</h4>
                  <p className="text-xs text-gray-400">Trek Vinicunca</p>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-[#2dd4bf] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
