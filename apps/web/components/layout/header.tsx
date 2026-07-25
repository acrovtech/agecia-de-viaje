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
  const [isScrolled, setIsScrolled] = useState(false);
  const [tours, setTours] = useState<MenuTour[]>([]);

  useEffect(() => {
    fetch('/api/tours/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTours(data);
      })
      .catch(console.error);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = variant === 'dark';

  return (
    <header 
      className={`w-full z-50 transition-all duration-300 ${
        isMobileMenuOpen 
          ? 'fixed top-0 left-0 bg-[#062918] shadow-md py-4' 
          : isDark 
            ? 'relative bg-[#062918] border-b border-[#0c4028]/80 shadow-md py-4' 
            : isScrolled
              ? 'fixed top-0 left-0 bg-[#062918]/95 backdrop-blur-md border-b border-[#0c4028]/60 shadow-lg py-3'
              : 'absolute top-0 left-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
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
