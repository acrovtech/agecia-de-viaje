'use client';

import { useState, useEffect } from 'react';
import { HeaderLogo } from './header/header-logo';
import { HeaderActions } from './header/header-actions';
import { DesktopNav } from './header/desktop-nav';
import { MobileNav } from './header/mobile-nav';

type MenuTour = {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  menuGroup: string | null;
};

export interface HeaderProps {
  variant?: 'transparent' | 'dark';
}

export function Header({ variant = 'transparent' }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tours, setTours] = useState<MenuTour[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/tours/menu', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTours(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error cargando menú de tours:', err);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const isDark = variant === 'dark';

  return (
    <header 
      className={`w-full z-50 transition-colors duration-300 ${
        isMobileMenuOpen 
          ? 'fixed top-0 left-0 bg-transparent py-4 md:py-5' 
          : isDark 
            ? 'relative bg-[#062918] border-b border-[#0c4028]/80 shadow-md py-4 md:py-5' 
            : 'absolute top-0 left-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent py-4 md:py-5'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Logo Modular */}
        <HeaderLogo />

        {/* Navegación Desktop Modular */}
        <DesktopNav tours={tours} />

        {/* Acciones del Header Modular (Carrito + Botón Menú Mobile) */}
        <HeaderActions 
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {/* Menú Drawer Mobile Modular */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
