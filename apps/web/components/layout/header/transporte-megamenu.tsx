'use client';

import Link from 'next/link';

export function TransporteMegamenu() {
  return (
    <div className="w-full px-6 py-4">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Transporte a Soraypampa</h3>
          <ul className="flex flex-col pr-2">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Cusco a Soraypampa (Ida y Vuelta)
              </Link>
            </li>

          </ul>
        </div>

        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Traslado Hotel - Aeropuerto</h3>
          <ul className="flex flex-col pr-2">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Aeropuerto Cusco → Hotel Cusco
              </Link>
            </li>
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href="/transporte" 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
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
