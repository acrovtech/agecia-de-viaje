import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MapPin, ArrowRight, Home, Mountain } from 'lucide-react';

function CuteLlamaSvg() {
  return (
    <div className="relative w-52 h-52 md:w-64 md:h-64 mx-auto mb-4 flex items-center justify-center">
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full relative z-10 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra en el suelo */}
        <ellipse cx="120" cy="205" rx="55" ry="8" fill="#E2E8F0" />

        {/* Patas Traseras */}
        <path d="M92 155V198C92 202 87 205 82 205H80V155H92Z" fill="#CBD5E1" />
        <path d="M148 155V198C148 202 143 205 138 205H136V155H148Z" fill="#CBD5E1" />

        {/* Patas Delanteras */}
        <path d="M102 155V200C102 203.5 97 205 92 205H90V155H102Z" fill="#062918" />
        <path d="M158 155V200C158 203.5 153 205 148 205H146V155H158Z" fill="#062918" />

        {/* Cuerpo Exponencial Suave */}
        <path
          d="M75 140C65 140 55 130 55 115C55 105 60 95 72 95C72 95 90 90 120 90C150 90 168 95 168 95C180 95 185 105 185 115C185 130 175 140 165 140H75Z"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Colita Fluffy */}
        <path
          d="M57 105C50 100 42 108 48 116C52 122 60 118 60 112"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Ponchito / Manta Andina Tradicional */}
        <path
          d="M95 92C95 92 120 98 145 92V135C145 135 120 142 95 135V92Z"
          fill="#008060"
          stroke="#062918"
          strokeWidth="3"
        />
        {/* Franjas del Ponchito */}
        <path d="M95 102H145" stroke="#F59E0B" strokeWidth="4" />
        <path d="M95 112H145" stroke="#E11D48" strokeWidth="4" />
        <path d="M95 122H145" stroke="#3B82F6" strokeWidth="4" />
        {/* Flecos del Ponchito */}
        <path d="M98 136V143M108 137V144M118 138V145M128 137V144M138 136V143" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cuello Alto Elegante */}
        <path
          d="M135 95V45C135 38 142 32 150 32C158 32 165 38 165 45V95"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Cabeza Tiers */}
        <path
          d="M135 48C135 38 145 28 158 28C171 28 178 35 178 48C178 56 170 62 158 62C145 62 135 58 135 48Z"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Orejita Izquierda */}
        <path
          d="M145 32L140 8C138 3 146 3 150 8L153 32"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M144 26L142 12" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round" />

        {/* Orejita Derecha */}
        <path
          d="M162 32L167 8C169 3 177 3 175 8L170 32"
          fill="#FFFFFF"
          stroke="#062918"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M165 26L167 12" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round" />

        {/* Chullo / Gorro Andino Tradicional */}
        <path
          d="M140 32C140 32 158 20 174 32V38H140V32Z"
          fill="#E11D48"
          stroke="#062918"
          strokeWidth="3"
        />
        {/* Pompones del Chullo */}
        <circle cx="157" cy="18" r="6" fill="#F59E0B" stroke="#062918" strokeWidth="2" />
        <path d="M140 38L137 46" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
        <path d="M174 38L177 46" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />

        {/* Ojitos Curiosos Ternos */}
        <circle cx="162" cy="42" r="4" fill="#062918" />
        <circle cx="163.5" cy="40.5" r="1.5" fill="#FFFFFF" />

        {/* Hocico tierno */}
        <ellipse cx="173" cy="48" rx="8" ry="6" fill="#F1F5F9" stroke="#062918" strokeWidth="2.5" />
        <path d="M173 47V50M170 51C171.5 53 174.5 53 176 51" stroke="#062918" strokeWidth="2" strokeLinecap="round" />

        {/* Cachetito Sonrojado */}
        <ellipse cx="152" cy="50" rx="4" ry="3" fill="#FDA4AF" />

        {/* Bufanda Andina en el Cuello */}
        <path
          d="M132 62C132 62 150 68 168 62L172 74C172 74 150 80 132 74V62Z"
          fill="#F59E0B"
          stroke="#062918"
          strokeWidth="3"
        />
        <path d="M152 70V88" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA] text-gray-900">
      {/* Header con estilo verde de marca (#062918) */}
      <Header variant="dark" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 text-center max-w-4xl mx-auto w-full">
        {/* SVG Llamita Exploradora */}
        <CuteLlamaSvg />

        {/* Número 404 Estilizado Limpio */}
        <h1 className="text-6xl md:text-8xl font-black font-heading text-[#062918] tracking-tight mb-2">
          404
        </h1>

        {/* Título Principal */}
        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 font-heading mb-3 tracking-tight">
          ¡Destino no encontrado!
        </h2>

        {/* Descripción Clara sin adornos excesivos */}
        <p className="text-gray-600 text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed font-sans">
          Nuestra llamita exploradora buscó por todos los Andes, pero la ruta o página que buscas no existe o ha sido movida.
        </p>

        {/* Botones de Acción directos sobre el fondo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-14">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#062918] hover:bg-[#041c10] text-white font-bold text-sm rounded-full shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Home size={18} />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/tours"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm rounded-full shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Mountain size={18} className="text-[#008060]" />
            <span>Ver todos los tours</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Rutas Populares Directas */}
        <div className="w-full border-t border-gray-200/80 pt-10">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-6 flex items-center justify-center gap-2">
            <MapPin size={15} className="text-[#008060]" />
            <span>Rutas populares recomendadas</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
            <Link 
              href="/tours/machu-picchu-full-day"
              className="group p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-[#008060]/40 rounded-2xl transition-all duration-200 text-left flex items-center justify-between shadow-2xs"
            >
              <div>
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#062918] transition-colors">Machu Picchu</h4>
                <p className="text-xs text-gray-500 mt-0.5">Full Day Express</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              href="/tours/camino-inca-4-dias"
              className="group p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-[#008060]/40 rounded-2xl transition-all duration-200 text-left flex items-center justify-between shadow-2xs"
            >
              <div>
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#062918]">Camino Inca</h4>
                <p className="text-xs text-gray-500 mt-0.5">4 Días / 3 Noches</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              href="/tours/montana-de-7-colores"
              className="group p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-[#008060]/40 rounded-2xl transition-all duration-200 text-left flex items-center justify-between shadow-2xs"
            >
              <div>
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#062918]">Vinicunca</h4>
                <p className="text-xs text-gray-500 mt-0.5">7 Colores</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-[#008060] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
