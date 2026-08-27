'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function TransporteMegamenu() {
  return (
    <div className="w-full px-6 py-4 select-none font-sans">
      <div className="grid grid-cols-2 gap-8">
        
        {/* Columna 1: Traslados Aeropuerto & Hotel */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-white">
            Traslados Aeropuerto & Hotel
          </h3>
          
          <ul className="flex flex-col pr-2">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href={`/transporte?from=${encodeURIComponent('Aeropuerto de Cusco')}&to=${encodeURIComponent('Hotel Cusco')}`} 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Aeropuerto Cusco ➔ Hotel Cusco
              </Link>
            </li>
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href={`/transporte?from=${encodeURIComponent('Hotel Cusco')}&to=${encodeURIComponent('Aeropuerto de Cusco')}`} 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Hotel Cusco ➔ Aeropuerto Cusco
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 2: Traslados a Soraypampa */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-white">
            Traslados a Soraypampa
          </h3>
          
          <ul className="flex flex-col pr-2">
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href={`/transporte?from=${encodeURIComponent('Hotel Cusco')}&to=${encodeURIComponent('Soraypampa')}`} 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Hotel Cusco ➔ Soraypampa
              </Link>
            </li>
            <li className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link 
                href={`/transporte?from=${encodeURIComponent('Soraypampa')}&to=${encodeURIComponent('Hotel Cusco')}`} 
                className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
              >
                Soraypampa ➔ Hotel Cusco
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer del Megamenu */}
      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
        <span className="text-white/60">Servicio privado directo con chofer profesional y puntualidad</span>
        <Link 
          href="/transporte"
          className="text-[#2dd4bf] hover:text-white font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Ver todas las rutas y cotizar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
