'use client';

import Link from 'next/link';

export function TransporteMegamenu() {
  return (
    <div className="w-full px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Item 1: Transporte a Soraypampa */}
        <Link 
          href="/transporte" 
          className="group block p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/30"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              🚌
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-[#2dd4bf] transition-colors mb-1">
                Transporte a Soraypampa
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Traslado cómodo y seguro hacia Soraypampa, inicio del trekking a Laguna Humantay y Salkantay.
              </p>
            </div>
          </div>
        </Link>

        {/* Item 2: Traslado Hotel al Aeropuerto o Viceversa */}
        <Link 
          href="/transporte" 
          className="group block p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/30"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
              ✈️
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-[#2dd4bf] transition-colors mb-1">
                Traslado Hotel - Aeropuerto / Viceversa
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Servicio privado y puntual de recojo entre el Aeropuerto Alejandro Velasco Astete y tu hotel en Cusco.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4 text-center border-t border-white/10 pt-3">
        <Link href="/transporte" className="text-xs font-semibold text-[#2dd4bf] hover:underline">
          Conoce nuestra flota completa y servicios privados →
        </Link>
      </div>
    </div>
  );
}
