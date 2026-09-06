'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

export function MobileSidebarDrawer({ 
  isMaster = true, 
  userEmail 
}: { 
  isMaster?: boolean; 
  userEmail?: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón en el Topbar (Mantiene la cabecera intacta) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none select-none border-none outline-none"
        title={isOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Overlay Oscuro (Ubicado DEBAJO de la cabecera top-14) */}
      <div 
        className={`fixed top-14 bottom-0 inset-x-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Lateral Deslizable (Inicia en top-14 debajo del Topbar, ocupa el 75% del ancho con letra a 16px) */}
      <div 
        className={`fixed top-14 bottom-0 left-0 w-[75vw] max-w-[320px] bg-[#EBEBEB] border-r border-slate-300/80 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out md:hidden select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto [&_a]:py-3 [&_span]:text-[15px] md:[&_span]:text-xs [&_svg]:w-5 [&_svg]:h-5" onClick={() => setIsOpen(false)}>
          <SidebarNav isMaster={isMaster} userEmail={userEmail} />
        </div>
      </div>
    </>
  );
}
