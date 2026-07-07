'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, Calendar, Users, Settings, PenTool, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const pathname = usePathname();
  
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        Principal
      </div>
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname === "/" ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Compass className="h-4 w-4" />
        Dashboard
      </Link>
      
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1">
        Gestión
      </div>
      <Link
        href="/tours"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/tours") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Map className="h-4 w-4" />
        Tours
      </Link>
      <Link
        href="/blogs"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/blogs") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <PenTool className="h-4 w-4" />
        Blogs
      </Link>
      <Link
        href="/categories"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/categories") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Tags className="h-4 w-4" />
        Categorías
      </Link>
      <Link
        href="/megamenus"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/megamenus") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Map className="h-4 w-4" />
        Megamenús
      </Link>
      <Link
        href="/reservas"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/reservas") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Calendar className="h-4 w-4" />
        Reservas
      </Link>
      <Link
        href="/clientes"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/clientes") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Users className="h-4 w-4" />
        Clientes
      </Link>
      
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1">
        Sistema
      </div>
      <Link
        href="/configuracion"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
          pathname?.startsWith("/configuracion") ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Settings className="h-4 w-4" />
        Configuración
      </Link>
    </nav>
  );
}
