'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderActionsProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function HeaderActions({ isMobileMenuOpen, onToggleMobileMenu }: HeaderActionsProps) {
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('incabound_cart');
        const urlParams = new URLSearchParams(window.location.search);
        if (saved || urlParams.get('tourTitle') || urlParams.get('slug')) {
          setCartCount(1);
        } else {
          setCartCount(0);
        }
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const textColor = isMobileMenuOpen ? 'text-gray-900' : 'text-white';
  const hoverBg = isMobileMenuOpen ? 'hover:bg-gray-100' : 'hover:bg-white/10';

  return (
    <div className={`flex items-center gap-5 text-sm z-50 transition-colors ${textColor}`}>
      {/* Shopping Cart Icon with Badge */}
      <Link 
        href="/carrito" 
        className={`relative p-2 transition-colors rounded-full ${hoverBg}`}
        aria-label="Ver Carrito"
      >
        <ShoppingCart size={22} />
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#2dd4bf] text-[#062918] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {cartCount}
          </span>
        )}
      </Link>

      {/* Mobile Menu Toggle Button */}
      <button 
        className={`lg:hidden transition-transform active:scale-95 p-1 relative w-9 h-9 flex items-center justify-center rounded-lg ${hoverBg}`}
        onClick={onToggleMobileMenu}
        aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <Menu 
          size={26} 
          strokeWidth={1.75} 
          className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
        />
        <X 
          size={26} 
          strokeWidth={1.75} 
          className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100 text-gray-900' : 'opacity-0 -rotate-90 scale-50'}`} 
        />
      </button>
    </div>
  );
}
