'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartManager } from '@/hooks/use-cart';

interface HeaderActionsProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function HeaderActions({ isMobileMenuOpen, onToggleMobileMenu }: HeaderActionsProps) {
  const { cartCount } = useCartManager();

  const textColor = isMobileMenuOpen ? 'text-gray-900' : 'text-white';
  const hoverBg = isMobileMenuOpen ? 'hover:bg-gray-100' : 'hover:bg-white/10';

  return (
    <div className={`flex items-center gap-5 text-sm z-50 transition-colors ${textColor}`}>
      {/* Shopping Cart Icon with Badge */}
      <Link 
        href="/checkout" 
        className={`relative p-2 transition-colors rounded-full ${hoverBg}`}
        aria-label="Ver Carrito de Reservas"
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
          className={`transition-all duration-300 transform ${
            isMobileMenuOpen ? 'opacity-0 scale-50 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
        <X 
          size={26} 
          strokeWidth={1.75} 
          className={`transition-all duration-300 transform ${
            isMobileMenuOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 absolute'
          }`}
        />
      </button>
    </div>
  );
}
