'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, Calendar, PenTool, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const pathname = usePathname();
  
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1.5">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 mt-5 first:mt-0">
        Principal
      </div>
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname === "/" 
            ? "bg-slate-900 text-white shadow-sm" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Compass className="h-4 w-4 opacity-70" />
        Dashboard
      </Link>
      
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-0.5">
        Gestión de Contenido
      </div>
      <Link
        href="/tours"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/tours") 
            ? "bg-slate-900 text-white shadow-sm" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Map className="h-4 w-4 opacity-70" />
        Tours
      </Link>
      <Link
        href="/blogs"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/blogs") 
            ? "bg-slate-900 text-white shadow-sm" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <PenTool className="h-4 w-4 opacity-70" />
        Blogs
      </Link>
      <Link
        href="/categories"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/categories") 
            ? "bg-slate-900 text-white shadow-sm" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Tags className="h-4 w-4 opacity-70" />
        Categorías
      </Link>
      
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-0.5">
        Ventas & Operaciones
      </div>
      <Link
        href="/reservas"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/reservas") 
            ? "bg-slate-900 text-white shadow-sm" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Calendar className="h-4 w-4 opacity-70" />
        Reservas
      </Link>
    </nav>
  );
}

