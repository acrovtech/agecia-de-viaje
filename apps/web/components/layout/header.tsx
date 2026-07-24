'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    fetch('/api/tours/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTours(data);
      })
      .catch(console.error);
  }, []);

  const isDark = variant === 'dark';

  return (
    <header 
      className={`left-0 w-full z-50 transition-colors duration-300 ${
        isMobileMenuOpen 
          ? 'fixed top-0 bg-[#062918] shadow-md py-3' 
          : isDark 
            ? 'relative top-0 bg-[#062918] border-b border-[#0c4028] shadow-md py-3' 
            : 'absolute top-0 py-4 mt-[10px]'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center z-50">
          <Image src="/logo.svg" alt="Inca Bound Logo" width={90} height={90} className="w-[60px] h-[60px] md:w-[78px] md:h-[78px] object-contain transition-all duration-300" priority />
        </Link>

        {/* Desktop Navigation & Megamenus */}
        <DesktopNav tours={tours} />

        {/* Right Section: Actions */}
        <div className={`flex items-center gap-6 text-sm z-50 transition-colors duration-300 ${isMobileMenuOpen ? 'text-white' : 'text-white'}`}>
          {/* Cart Icon */}
          <Link href="/carrito" className="relative hover:text-[#2dd4bf] transition-colors">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-[#2dd4bf] text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden transition-transform active:scale-95 p-1 relative w-8 h-8 flex items-center justify-center overflow-hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu 
              size={28} 
              strokeWidth={1.5} 
              className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
            />
            <X 
              size={28} 
              strokeWidth={1.5} 
              className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} 
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
