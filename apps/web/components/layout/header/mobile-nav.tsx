'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin, Car, Compass } from 'lucide-react';

const DESTINOS = [
  { name: 'Cusco', href: '/tours?destino=cusco' },
  { name: 'Puno', href: '/tours?destino=puno' },
  { name: 'Arequipa', href: '/tours?destino=arequipa' },
  { name: 'Ica', href: '/tours?destino=ica' },
  { name: 'Lima', href: '/tours?destino=lima' },
  { name: 'Selva', href: '/tours?destino=selva' },
];

const TRASLADOS = [
  { name: 'Aeropuerto Cusco ➔ Hotel', href: '/transporte?from=Aeropuerto%20de%20Cusco&to=Hotel%20Cusco' },
  { name: 'Hotel Cusco ➔ Aeropuerto', href: '/transporte?from=Hotel%20Cusco&to=Aeropuerto%20de%20Cusco' },
  { name: 'Hotel Cusco ➔ Soraypampa', href: '/transporte?from=Hotel%20Cusco&to=Soraypampa' },
  { name: 'Soraypampa ➔ Hotel Cusco', href: '/transporte?from=Soraypampa&to=Hotel%20Cusco' },
];

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isDestinosOpen, setIsDestinosOpen] = useState(false);
  const [isTransporteOpen, setIsTransporteOpen] = useState(false);

  return (
    <div 
      className={`fixed inset-0 w-full h-full bg-white z-40 lg:hidden flex flex-col pt-20 pb-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-y-auto ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <nav className="flex-1 flex flex-col justify-start text-[#555] font-bold text-center uppercase tracking-wider text-sm">
        <Link 
          href="/" 
          className="relative py-5 border-b border-gray-100 flex items-center justify-center uppercase tracking-wider hover:text-[#062918] transition-colors" 
          onClick={onClose}
        >
          INICIO
        </Link>

        {/* Acordeón: Destinos */}
        <div className="border-b border-gray-100 flex flex-col">
          <button
            type="button"
            onClick={() => setIsDestinosOpen(!isDestinosOpen)}
            className={`relative py-5 px-6 w-full flex items-center justify-center uppercase tracking-wider transition-colors cursor-pointer ${
              isDestinosOpen ? 'text-[#008060]' : 'hover:text-[#062918]'
            }`}
          >
            <span>DESTINOS</span>
            <ChevronDown 
              size={18} 
              className={`absolute right-6 transition-transform duration-300 ${
                isDestinosOpen ? 'rotate-180 text-[#008060]' : 'text-gray-400'
              }`} 
            />
          </button>

          <div 
            className={`grid transition-all duration-300 ease-in-out ${
              isDestinosOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-[#fbfcfc] py-4 px-6 flex flex-col items-center justify-center gap-3.5 border-t border-gray-100">
                {DESTINOS.map((d) => (
                  <Link
                    key={d.name}
                    href={d.href}
                    onClick={onClose}
                    className="text-[13px] font-normal normal-case tracking-normal text-slate-600 hover:text-[#062918] hover:underline underline-offset-4 transition-colors py-0.5"
                  >
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Acordeón: Solo Transporte */}
        <div className="border-b border-gray-100 flex flex-col">
          <button
            type="button"
            onClick={() => setIsTransporteOpen(!isTransporteOpen)}
            className={`relative py-5 px-6 w-full flex items-center justify-center uppercase tracking-wider transition-colors cursor-pointer ${
              isTransporteOpen ? 'text-[#008060]' : 'hover:text-[#062918]'
            }`}
          >
            <span>SOLO TRANSPORTE</span>
            <ChevronDown 
              size={18} 
              className={`absolute right-6 transition-transform duration-300 ${
                isTransporteOpen ? 'rotate-180 text-[#008060]' : 'text-gray-400'
              }`} 
            />
          </button>

          <div 
            className={`grid transition-all duration-300 ease-in-out ${
              isTransporteOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-[#fbfcfc] py-4 px-6 flex flex-col items-center justify-center gap-3.5 border-t border-gray-100">
                {TRASLADOS.map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    onClick={onClose}
                    className="text-[13px] font-normal normal-case tracking-normal text-slate-600 hover:text-[#062918] hover:underline underline-offset-4 transition-colors py-0.5"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link 
          href="/blog" 
          className="relative py-5 border-b border-gray-100 uppercase tracking-wider hover:text-[#062918] transition-colors" 
          onClick={onClose}
        >
          BLOGS
        </Link>
        <Link 
          href="/nosotros" 
          className="relative py-5 border-b border-gray-100 uppercase tracking-wider hover:text-[#062918] transition-colors" 
          onClick={onClose}
        >
          NOSOTROS
        </Link>
        <Link 
          href="/contacto" 
          className="relative py-5 border-b border-gray-100 uppercase tracking-wider hover:text-[#062918] transition-colors" 
          onClick={onClose}
        >
          CONTACTO
        </Link>
      </nav>
    </div>
  );
}

