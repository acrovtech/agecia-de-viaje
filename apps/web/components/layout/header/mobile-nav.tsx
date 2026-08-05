'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div 
      className={`fixed inset-0 w-full h-full bg-white z-40 lg:hidden flex flex-col pt-20 pb-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <nav className="flex-1 flex flex-col justify-center text-[#555] font-bold text-center uppercase tracking-wider text-sm">
        <Link href="/" className="relative py-5 border-b border-gray-100 flex items-center justify-center" onClick={onClose}>
          Inicio
        </Link>
        <div className="relative border-b border-gray-100 flex items-center justify-center">
          <Link href="/tours" className="py-5 w-full text-center" onClick={onClose}>
            Destinos
          </Link>
          <ChevronDown size={18} className="absolute right-6 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative border-b border-gray-100 flex items-center justify-center">
          <Link href="/transporte" className="py-5 w-full text-center" onClick={onClose}>
            Solo Transporte
          </Link>
          <ChevronDown size={18} className="absolute right-6 text-gray-400 pointer-events-none" />
        </div>
        <Link href="/blog" className="relative py-5 border-b border-gray-100" onClick={onClose}>
          Blogs
        </Link>
        <Link href="/nosotros" className="relative py-5 border-b border-gray-100" onClick={onClose}>
          Nosotros
        </Link>
        <Link href="/contacto" className="relative py-5 border-b border-gray-100" onClick={onClose}>
          Contacto
        </Link>
      </nav>
    </div>
  );
}
