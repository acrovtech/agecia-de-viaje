'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, Calendar, PenTool, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const pathname = usePathname();
  
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1.5">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mb-0.5">
        Principal
      </div>
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname === "/" 
            ? "bg-[#0B4354] text-white shadow-sm ring-1 ring-white/10" 
            : "text-slate-300 hover:text-white hover:bg-emerald-900/40"
        )}
      >
        <Compass className="h-4 w-4 text-emerald-400" />
        Dashboard
      </Link>
      
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mt-5 mb-0.5">
        Gestión de Contenido
      </div>
      <Link
        href="/tours"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/tours") 
            ? "bg-[#0B4354] text-white shadow-sm ring-1 ring-white/10" 
            : "text-slate-300 hover:text-white hover:bg-emerald-900/40"
        )}
      >
        <Map className="h-4 w-4 text-emerald-400" />
        Tours
      </Link>
      <Link
        href="/blogs"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/blogs") 
            ? "bg-[#0B4354] text-white shadow-sm ring-1 ring-white/10" 
            : "text-slate-300 hover:text-white hover:bg-emerald-900/40"
        )}
      >
        <PenTool className="h-4 w-4 text-emerald-400" />
        Blogs
      </Link>
      <Link
        href="/categories"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/categories") 
            ? "bg-[#0B4354] text-white shadow-sm ring-1 ring-white/10" 
            : "text-slate-300 hover:text-white hover:bg-emerald-900/40"
        )}
      >
        <Tags className="h-4 w-4 text-emerald-400" />
        Categorías
      </Link>
      
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 mt-5 mb-0.5">
        Ventas & Operaciones
      </div>
      <Link
        href="/reservas"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 font-medium",
          pathname?.startsWith("/reservas") 
            ? "bg-[#0B4354] text-white shadow-sm ring-1 ring-white/10" 
            : "text-slate-300 hover:text-white hover:bg-emerald-900/40"
        )}
      >
        <Calendar className="h-4 w-4 text-emerald-400" />
        Reservas
      </Link>
    </nav>
  );
}

