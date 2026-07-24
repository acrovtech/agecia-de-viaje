import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MapPin, ArrowRight, Home, Mountain } from 'lucide-react';

function AnimatedLlamaSvg() {
  return (
    <div className="relative w-60 h-60 md:w-72 md:h-72 mx-auto mb-2 flex items-center justify-center select-none">
      <style>{`
        @keyframes llamaBreath {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1.5deg); }
        }
        @keyframes earWiggle {
          0%, 88%, 100% { transform: rotate(0deg); }
          92% { transform: rotate(-12deg); }
          96% { transform: rotate(6deg); }
        }
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(15px); }
        }
        .animate-llama-body {
          animation: llamaBreath 4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-[#062918] {
          animation: earWiggle 5s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-tail {
          animation: tailWag 3s ease-in-out infinite;
          transform-origin: top right;
        }
        .animate-cloud-slow {
          animation: cloudFloat 7s ease-in-out infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 300 300"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nubes Suaves de Fondo */}
        <g className="animate-cloud-slow" opacity="0.6">
          <path d="M30 70C30 63.4 35.4 58 42 58C46.3 58 50.1 60.3 52.2 63.7C53.7 61.6 56.1 60.3 58.8 60.3C63.4 60.3 67.2 64.1 67.2 68.7C67.2 69.1 67.1 69.5 67.1 69.9C69.2 71 70.7 73.3 70.7 75.9C70.7 79.9 67.5 83.1 63.5 83.1H36C32.7 83.1 30 80.4 30 77.1V70Z" fill="#CBD5E1" />
          <path d="M210 50C210 44.5 214.5 40 220 40C223.6 40 226.8 41.9 228.5 44.8C229.8 43.1 231.8 42 234 42C237.9 42 241 45.1 241 49C241 49.3 241 49.7 240.9 50C242.7 50.9 244 52.8 244 55C244 58.3 241.3 61 238 61H215C212.2 61 210 58.8 210 56V50Z" fill="#E2E8F0" />
        </g>

        {/* Sombra en el Suelo */}
        <ellipse cx="150" cy="255" rx="75" ry="10" fill="#E2E8F0" />

        {/* --- GRUPO ANIMA DE LA LLAMA --- */}
        <g className="animate-llama-body">

          {/* Patita Trasera Izquierda (Fondo) */}
          <path d="M105 185C105 185 102 225 100 248C100 252 94 254 88 254C84 254 82 250 83 245L90 185H105Z" fill="#CBD5E1" />
          {/* Patita Delantera Izquierda (Fondo) */}
          <path d="M185 185C185 185 182 225 180 248C180 252 174 254 168 254C164 254 162 250 163 245L170 185H185Z" fill="#CBD5E1" />

          {/* Colita Fluffy Movible */}
          <g className="animate-tail">
            <path
              d="M72 135C60 128 48 138 52 152C55 162 66 165 74 158"
              fill="#FFFFFF"
              stroke="#062918"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Cuerpo Esponjoso Principal */}
          <path
            d="M80 170C68 170 60 155 60 140C60 125 72 115 88 115H172C188 115 200 125 200 140C200 155 192 170 180 170H80Z"
            fill="#FFFFFF"
            stroke="#062918"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Textura de Lana en la Espalda */}
          <path d="M70 130C66 122 74 116 80 120C84 112 94 114 96 120" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

          {/* Patita Trasera Derecha (Frente) */}
          <path d="M118 170C118 170 115 220 113 248C113 252 107 254 102 254C98 254 96 250 97 245L105 170H118Z" fill="#FFFFFF" stroke="#062918" strokeWidth="4" strokeLinejoin="round" />
          {/* Pesuña Trasera */}
          <path d="M113 244L113 248C113 252 107 254 102 254C98 254 96 250 97 245L98 244H113Z" fill="#062918" />

          {/* Patita Delantera Derecha (Frente) */}
          <path d="M198 170C198 170 195 220 193 248C193 252 187 254 182 254C178 254 176 250 177 245L185 170H198Z" fill="#FFFFFF" stroke="#062918" strokeWidth="4" strokeLinejoin="round" />
          {/* Pesuña Delantera */}
          <path d="M193 244L193 248C193 252 187 254 182 254C178 254 176 250 177 245L178 244H193Z" fill="#062918" />

          {/* Manta Andina Tradicional (Ponchito) */}
          <path
            d="M105 115C105 115 135 124 165 115V168C165 168 135 177 105 168V115Z"
            fill="#008060"
            stroke="#062918"
            strokeWidth="4"
          />
          {/* Franjas Multicolor del Ponchito */}
          <path d="M105 128H165" stroke="#F59E0B" strokeWidth="5" />
          <path d="M105 141H165" stroke="#E11D48" strokeWidth="5" />
          <path d="M105 154H165" stroke="#3B82F6" strokeWidth="5" />
          {/* Flecos del Ponchito */}
          <path d="M110 169V177M122 170V178M135 171V179M148 170V178M160 169V177" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

          {/* Cuello y Cabeza */}
          <path
            d="M152 120V55C152 46 160 38 170 38C180 38 188 46 188 55V120"
            fill="#FFFFFF"
            stroke="#062918"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Cabeza de la Llamita */}
          <path
            d="M152 55C152 42 162 30 178 30C194 30 204 40 204 55C204 65 194 72 178 72C162 72 152 65 152 55Z"
            fill="#FFFFFF"
            stroke="#062918"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Orejita Izquierda Animada */}
          <g className="animate-[#062918]">
            <path
              d="M162 34L156 8C154 3 162 2 167 7L171 34"
              fill="#FFFFFF"
              stroke="#062918"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path d="M162 26L160 12" stroke="#FDA4AF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Orejita Derecha Animada */}
          <g className="animate-[#062918]" style={{ animationDelay: '0.3s' }}>
            <path
              d="M182 34L188 8C190 3 198 2 196 7L191 34"
              fill="#FFFFFF"
              stroke="#062918"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path d="M185 26L187 12" stroke="#FDA4AF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Chullo / Gorrito Andino Tradicional */}
          <path
            d="M156 34C156 34 176 18 194 34V42H156V34Z"
            fill="#E11D48"
            stroke="#062918"
            strokeWidth="3.5"
          />
          {/* Pompón Superior del Chullo */}
          <circle cx="175" cy="18" r="7" fill="#F59E0B" stroke="#062918" strokeWidth="2.5" />
          {/* Orejeras Colgantes del Chullo */}
          <path d="M156 42L152 54" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
          <circle cx="151" cy="56" r="3" fill="#F59E0B" />
          <path d="M194 42L198 54" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
          <circle cx="199" cy="56" r="3" fill="#F59E0B" />

          {/* Ojitos Tiernos Curiosos */}
          <circle cx="182" cy="48" r="4.5" fill="#062918" />
          <circle cx="184" cy="46" r="1.5" fill="#FFFFFF" />

          {/* Hocico Tierno */}
          <ellipse cx="196" cy="55" rx="9" ry="7" fill="#F1F5F9" stroke="#062918" strokeWidth="3" />
          <path d="M196 54V58M192 59C194 61 198 61 200 59" stroke="#062918" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cachetito Sonrojado */}
          <ellipse cx="170" cy="56" rx="5" ry="3.5" fill="#FDA4AF" />

          {/* Bufanda Andina en el Cuello */}
          <path
            d="M148 72C148 72 170 80 192 72L196 86C196 86 170 94 148 86V72Z"
            fill="#F59E0B"
            stroke="#062918"
            strokeWidth="3.5"
          />
          <path d="M172 82V102" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" />
        </g>
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
        {/* SVG Llamita Exploradora Animada */}
        <AnimatedLlamaSvg />

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

        {/* Botones de Acción - Ancho natural, sin texto partido en 2 líneas, sin pill deforme */}
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

        {/* Rutas Populares Recomendadas */}
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
