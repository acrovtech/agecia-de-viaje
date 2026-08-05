'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { DestinosMegamenu } from './destinos-megamenu';
import { CaminatasMegamenu } from './caminatas-megamenu';
import { PaquetesMegamenu } from './paquetes-megamenu';
import { TransporteMegamenu } from './transporte-megamenu';

type MenuTour = {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  menuGroup: string | null;
};

export function DesktopNav({ tours }: { tours: MenuTour[] }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav 
      className="hidden lg:flex items-center gap-16 text-white/70 font-medium text-[17px] h-full relative"
      onMouseLeave={() => setActiveMenu(null)}
    >
      <Link href="/" className="hover:text-white transition-colors py-4">Inicio</Link>
      
      {/* Destinos */}
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
        onMouseEnter={() => setActiveMenu('destinos')}
      >
        <span>Destinos</span> <ChevronDown size={14} />
      </div>

      {/* Caminatas */}
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
        onMouseEnter={() => setActiveMenu('caminatas')}
      >
        <span>Caminatas</span> <ChevronDown size={14} />
      </div>

      {/* Paquetes */}
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
        onMouseEnter={() => setActiveMenu('paquetes')}
      >
        <span>Paquetes</span> <ChevronDown size={14} />
      </div>

      {/* Solo Transporte */}
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
        onMouseEnter={() => setActiveMenu('transporte')}
      >
        <span>Solo Transporte</span> <ChevronDown size={14} />
      </div>

      <Link href="/blog" className="hover:text-white transition-colors py-4">Blogs</Link>
      <Link href="/nosotros" className="hover:text-white transition-colors py-4">Nosotros</Link>
      <Link href="/contacto" className="hover:text-white transition-colors py-4">Contáctanos</Link>

      {/* Megamenu Container */}
      {activeMenu && (
        <div className="absolute top-full left-0 w-full pt-2 z-50">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl text-white">
            {activeMenu === 'destinos' && <DestinosMegamenu />}
            {activeMenu === 'caminatas' && <CaminatasMegamenu />}
            {activeMenu === 'paquetes' && <PaquetesMegamenu tours={tours} />}
            {activeMenu === 'transporte' && <TransporteMegamenu />}
          </div>
        </div>
      )}
    </nav>
  );
}
