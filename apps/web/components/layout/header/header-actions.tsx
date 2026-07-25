import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';

interface HeaderActionsProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function HeaderActions({ isMobileMenuOpen, onToggleMobileMenu }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-5 text-sm z-50 text-white">
      {/* Shopping Cart Icon with Badge */}
      <Link 
        href="/carrito" 
        className="relative p-2 hover:text-[#2dd4bf] transition-colors rounded-full hover:bg-white/10"
        aria-label="Ver Carrito"
      >
        <ShoppingCart size={22} />
        <span className="absolute top-0 right-0 bg-[#2dd4bf] text-[#062918] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
          0
        </span>
      </Link>

      {/* Mobile Menu Toggle Button */}
      <button 
        className="lg:hidden transition-transform active:scale-95 p-1 relative w-9 h-9 flex items-center justify-center text-white rounded-lg hover:bg-white/10"
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
          className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} 
        />
      </button>
    </div>
  );
}
