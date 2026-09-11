'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Map, 
  Car, 
  Tags, 
  PenTool, 
  Calendar, 
  Store, 
  Users, 
  Terminal,
  ExternalLink,
  Mail 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStorefrontUrl } from '@/lib/site-config';

export function SidebarNav({ 
  isMaster = true, 
  userRole = 'MASTER',
  userEmail 
}: { 
  isMaster?: boolean; 
  userRole?: string;
  userEmail?: string; 
}) {
  const pathname = usePathname();
  const siteUrl = getStorefrontUrl();

  const normalizedRole = userRole === 'CLIENT' ? 'CONTENT_CREATOR' : userRole;
  const isSuperAdmin = normalizedRole === 'SUPERADMIN';
  const isMasterUser = isMaster || normalizedRole === 'MASTER' || isSuperAdmin;
  const isOperator = normalizedRole === 'OPERATOR';
  const isContentCreator = normalizedRole === 'CONTENT_CREATOR';
  const isMarketing = normalizedRole === 'MARKETING';

  // Reglas de visibilidad por rol
  const showTours = isMasterUser || isContentCreator || isOperator;
  const showTransfers = isMasterUser || isOperator;
  const showCategories = isMasterUser || isContentCreator;
  const showBlogs = isMasterUser || isContentCreator;
  const showEmailMarketing = isMasterUser || isMarketing;
  const showReservas = isMasterUser || isOperator;
  const showUsuarios = isMasterUser;
  const showLogs = isSuperAdmin;

  return (
    <div className="flex flex-col h-full bg-[#EBEBEB] text-[#303030] border-none select-none text-[13px]">
      
      {/* NAVEGACIÓN PRINCIPAL LIMPIA */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        <ul className="space-y-1 font-medium">
          
          {/* 1. Inicio / Dashboard */}
          <li>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                pathname === "/"
                  ? "bg-white text-[#303030] shadow-xs font-semibold"
                  : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
              )}
            >
              <Home className="w-4 h-4 text-[#303030] shrink-0" />
              <span>Inicio</span>
            </Link>
          </li>

          {/* 2. Reservas (Primer orden para Operador y Master) */}
          {showReservas && (
            <li>
              <Link
                href="/reservas"
                className={cn(
                  "flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname?.startsWith("/reservas")
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#303030] shrink-0" />
                  <span>Reservas</span>
                </div>
              </Link>
            </li>
          )}

          {/* 3. Tours & Experiencias */}
          {showTours && (
            <li>
              <Link
                href="/tours"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname?.startsWith("/tours")
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <Map className="w-4 h-4 text-[#303030] shrink-0" />
                <span>Tours</span>
              </Link>
            </li>
          )}

          {/* 4. Transportes / Traslados */}
          {showTransfers && (
            <li>
              <Link
                href="/transporte"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname?.startsWith("/transporte")
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <Car className="w-4 h-4 text-[#303030] shrink-0" />
                <span>Transportes</span>
              </Link>
            </li>
          )}

          {/* 5. Categorías */}
          {showCategories && (
            <li>
              <Link
                href="/categories"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname === "/categories"
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <Tags className="w-4 h-4 text-[#303030] shrink-0" />
                <span>Categorías</span>
              </Link>
            </li>
          )}

          {/* 6. Blogs */}
          {showBlogs && (
            <li>
              <Link
                href="/blogs"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname?.startsWith("/blogs")
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <PenTool className="w-4 h-4 text-[#303030] shrink-0" />
                <span>Blogs</span>
              </Link>
            </li>
          )}

          {/* 7. Email Marketing (Para Equipo de Marketing y Master) */}
          {showEmailMarketing && (
            <li>
              <Link
                href="/marketing"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                  pathname?.startsWith("/marketing")
                    ? "bg-white text-[#303030] shadow-xs font-semibold"
                    : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                )}
              >
                <Mail className="w-4 h-4 text-[#303030] shrink-0" />
                <span>Email Marketing</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Sección: Administración & Seguridad (Exclusivo para Master) */}
        {showUsuarios && (
          <div className="pt-3 border-t border-slate-300/50">
            <div className="px-3 mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Seguridad & Equipo</span>
            </div>

            <ul className="space-y-1 font-medium">
              <li>
                <Link
                  href="/usuarios"
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                    pathname?.startsWith("/usuarios")
                      ? "bg-white text-[#303030] shadow-xs font-semibold"
                      : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                  )}
                >
                  <Users className="w-4 h-4 text-[#303030] shrink-0" />
                  <span>Usuarios y Roles</span>
                </Link>
              </li>

              {/* Logs de Auditoría Forense (Exclusivo SuperAdmin) */}
              {showLogs && (
                <li>
                  <Link
                    href="/logs"
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium",
                      pathname?.startsWith("/logs")
                        ? "bg-white text-[#303030] shadow-xs font-semibold"
                        : "text-[#303030] hover:bg-slate-200/70 hover:text-black"
                    )}
                  >
                    <Terminal className="w-4 h-4 text-[#303030] shrink-0" />
                    <span>Logs de Auditoría</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Sección: Canales de ventas */}
        <div className="pt-3 border-t border-slate-300/50">
          <div className="px-3 mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Canal de ventas</span>
          </div>

          <ul className="space-y-1 font-medium">
            <li>
              <a 
                href={siteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#303030] hover:bg-slate-200/70 hover:text-black transition-colors text-[13px]"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-[#303030] shrink-0" />
                  <span>Tienda Online Pública</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
