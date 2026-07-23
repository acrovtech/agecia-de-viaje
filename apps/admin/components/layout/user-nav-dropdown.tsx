'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { logoutAction } from '../../app/actions/auth';

interface UserNavDropdownProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  userRole: string;
}

export function UserNavDropdown({ userName, userEmail, userInitials, userRole }: UserNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Insignia de Usuario (TopBar) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white p-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
      >
        <div className="w-6 h-6 rounded-md bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
          {userInitials}
        </div>
        <span className="hidden sm:inline font-medium text-slate-200 text-xs">{userName}</span>
      </button>

      {/* Popover / Dropdown Menu Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-64 rounded-lg bg-white border border-slate-200/90 shadow-lg text-slate-800 p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100 font-sans text-xs">
          
          {/* 1. Usuario Logueado */}
          <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-slate-900 truncate">{userEmail}</span>
              <span className="text-[10px] text-slate-400 font-medium">{userRole}</span>
            </div>
          </div>

          {/* Línea Divisoria Fina */}
          <div className="h-[1px] bg-slate-200/80 my-1" />

          {/* 2. Cerrar Sesión */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 p-2 rounded-md text-slate-700 hover:text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="text-xs font-semibold">Cerrar sesión</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
