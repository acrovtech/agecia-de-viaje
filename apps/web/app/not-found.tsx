import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MapPin, ArrowRight, Home, Mountain, Sparkles } from 'lucide-react';

function Llama404Svg() {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto mb-6 flex items-center justify-center">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-emerald-100/70 rounded-full blur-2xl transform scale-90" />

      {/* SVG Llamita Exploradora */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nubes flotantes */}
        <path
          d="M25 55C25 49.4772 29.4772 45 35 45C38.6433 45 41.7997 46.9451 43.5 49.827C44.7554 48.0674 46.7869 47 49 47C52.866 47 56 50.134 56 54C56 54.3414 55.9756 54.677 55.9288 55.0051C57.7317 55.9084 59 57.8073 59 60C59 63.3137 56.3137 66 53 66H30C27.2386 66 25 63.7614 25 61V55Z"
          fill="#E2E8F0"
          className="animate-pulse"
        />
        <path
          d="M140 35C140 29.4772 144.477 25 150 25C153.643 25 156.8 26.9451 158.5 29.827C159.755 28.0674 161.787 27 164 27C167.866 27 171 30.134 171 34C171 34.3414 170.976 34.677 170.929 35.0051C172.732 35.9084 174 37.8073 174 40C174 43.3137 171.314 46 168 46H145C142.239 46 140 43.7614 140 41V35Z"
          fill="#CBD5E1"
          className="animate-pulse"
        />

        {/* Cuerpo de la Llamita */}
        <path
          d="M75 145C75 125 90 115 110 115C130 115 145 125 145 145V165H75V145Z"
          fill="#F8FAFC"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Patitas */}
        <rect x="85" y="160" width="10" height="25" rx="5" fill="#062918" />
        <rect x="125" y="160" width="10" height="25" rx="5" fill="#062918" />

        {/* Ponchito / Manta Andina Multicolor */}
        <path
          d="M85 130C85 130 110 138 135 130V150C135 150 110 158 85 150V130Z"
          fill="#008060"
          stroke="#062918"
          strokeWidth="2.5"
        />
        <path d="M85 137H135" stroke="#F59E0B" strokeWidth="3" />
        <path d="M85 143H135" stroke="#EF4444" strokeWidth="3" />

        {/* Cuello y Cabeza */}
        <path
          d="M85 135V75C85 60 95 50 110 50C118 50 125 55 125 65V135"
          fill="#F8FAFC"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Orejitas */}
        <path
          d="M92 52L86 32C85 28 92 28 95 32L100 52"
          fill="#F8FAFC"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
          className="origin-bottom animate-bounce-slow"
        />
        <path
          d="M108 52L112 32C113 28 120 28 119 32L115 52"
          fill="#F8FAFC"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Chullo / Gorrito Andino */}
        <path d="M88 52C88 52 103 40 118 52V58H88V52Z" fill="#EF4444" stroke="#062918" strokeWidth="2.5" />
        <circle cx="103" cy="38" r="6" fill="#F59E0B" stroke="#062918" strokeWidth="2" />

        {/* Ojitos Tiernos */}
        <circle cx="98" cy="68" r="3.5" fill="#062918" />
        <circle cx="99.5" cy="66.5" r="1" fill="#FFFFFF" />

        {/* Nariz / Hocico */}
        <ellipse cx="90" cy="74" rx="7" ry="5" fill="#E2E8F0" stroke="#062918" strokeWidth="2" />
        <path d="M88 74Q90 77 92 74" stroke="#062918" strokeWidth="2" strokeLinecap="round" />

        {/* Cachetito Sonrojado */}
        <circle cx="104" cy="74" r="3.5" fill="#F43F5E" fillOpacity="0.4" />

        {/* Brújula/Medalla colgando */}
        <circle cx="110" cy="115" r="7" fill="#F59E0B" stroke="#062918" strokeWidth="2" />
        <path d="M110 110V120M105 115H115" stroke="#062918" strokeWidth="1.5" />

        {/* Signo de Pregunta animado flotando */}
        <g className="animate-bounce">
          <circle cx="152" cy="72" r="16" fill="#062918" />
          <text
            x="152"
            y="78"
            fill="#2DD4BF"
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            ?
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA] text-gray-900">
      {/* Header con estilo oscuro de la marca (#062918) */}
      <Header variant="dark" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
        <div className="bg-white p-8 md:p-14 rounded-3xl border border-gray-200/80 shadow-xl max-w-2xl w-full flex flex-col items-center relative overflow-hidden">
          
          {/* Accent top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#062918] via-[#008060] to-[#2dd4bf]" />

          {/* SVG Llamita Animada */}
          <Llama404Svg />

          {/* Badge 404 */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-[#008060] font-bold text-xs tracking-wider uppercase mb-3 border border-emerald-200/60">
            <Sparkles size={14} />
            Error 404
          </span>

          {/* Title & Description */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#062918] font-heading mb-3 tracking-tight">
            ¡Destino no encontrado!
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Nuestra llamita exploradora buscó por todos los Andes, pero la ruta o página que buscas no existe o ha sido movida.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mb-10">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#062918] hover:bg-[#041c10] text-white font-semibold text-sm rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Home size={18} />
              <span>Volver al Inicio</span>
            </Link>

            <Link
              href="/tours"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 font-semibold text-sm rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Mountain size={18} className="text-[#008060]" />
              <span>Ver todos los tours</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick Recommendation Destinations */}
          <div className="w-full border-t border-gray-100 pt-8 mt-2">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4 flex items-center justify-center gap-1.5">
              <MapPin size={14} className="text-[#008060]" />
              <span>Rutas populares para explorar</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <Link 
                href="/tours/machu-picchu-full-day"
                className="group p-3.5 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#062918]">Machu Picchu</h4>
                  <p className="text-[11px] text-gray-500">Full Day Express</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                href="/tours/camino-inca-4-dias"
                className="group p-3.5 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#062918]">Camino Inca</h4>
                  <p className="text-[11px] text-gray-500">4 Días / 3 Noches</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link 
                href="/tours/montana-de-7-colores"
                className="group p-3.5 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 text-left flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#062918]">Vinicunca</h4>
                  <p className="text-[11px] text-gray-500">7 Colores</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
