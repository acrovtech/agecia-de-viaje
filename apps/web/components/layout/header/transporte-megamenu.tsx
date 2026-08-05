'use client';

import Link from 'next/link';

export function TransporteMegamenu() {
  return (
    <div className="w-full px-8 py-6">
      <div className="grid grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* Columna 1: Transporte a Soraypampa */}
        <div>
          <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">
            Transporte a Soraypampa
          </h3>
          <ul className="flex flex-col">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2.5 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm font-medium"
              >
                Cusco a Soraypampa (Ida y Vuelta)
              </Link>
            </li>
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2.5 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm font-medium"
              >
                Servicio Privado Salkantay Trek
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 2: Traslado Hotel al Aeropuerto o Viceversa */}
        <div>
          <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">
            Traslado Hotel - Aeropuerto
          </h3>
          <ul className="flex flex-col">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2.5 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm font-medium"
              >
                Aeropuerto Cusco → Hotel Cusco
              </Link>
            </li>
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2.5 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm font-medium"
              >
                Hotel Cusco → Aeropuerto Cusco
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
