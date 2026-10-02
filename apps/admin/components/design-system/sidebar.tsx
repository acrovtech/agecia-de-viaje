'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CalendarCheck2,
  Compass,
  Layers,
  MapPin,
  Car,
  Users2,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Tag,
  Truck,
} from 'lucide-react';
import { logoutAction } from '../../app/actions/auth';
import { PRODUCT_SHORT_NAME } from '../../lib/brand';

export interface NavIdentity {
  userId: string;
  email: string;
  agencyId: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'VIEWER';
  agencyName: string;
  agencySlug: string;
}

interface SidebarProps {
  identity: NavIdentity;
  onNavigate?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('OWNER' | 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'VIEWER')[];
  badge?: string;
  children?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: ('OWNER' | 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'VIEWER')[];
  }[];
}

const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Reservas',
    href: '/reservations',
    icon: CalendarCheck2,
    roles: ['OWNER', 'ADMIN', 'OPERATOR'],
  },
  {
    label: 'Operaciones',
    href: '/operations',
    icon: Compass,
    roles: ['OWNER', 'ADMIN', 'OPERATOR'],
  },
  {
    label: 'Catálogo',
    href: '/catalog/tours',
    icon: Layers,
    children: [
      {
        label: 'Tours',
        href: '/catalog/tours',
        icon: MapPin,
      },
      {
        label: 'Traslados',
        href: '/catalog/transfers',
        icon: Car,
      },
    ],
  },
  {
    label: 'Recursos',
    href: '/resources/categories',
    icon: Truck,
    roles: ['OWNER', 'ADMIN', 'OPERATOR', 'EDITOR'],
    children: [
      {
        label: 'Categorías comerciales',
        href: '/resources/categories',
        icon: Tag,
      },
      {
        label: 'Vehículos comerciales',
        href: '/resources/vehicles',
        icon: Car,
      },
      {
        label: 'Flota operativa',
        href: '/resources/fleet',
        icon: Truck,
        roles: ['OWNER', 'ADMIN', 'OPERATOR'],
      },
      {
        label: 'Guías y Conductores',
        href: '/resources/personnel',
        icon: Users2,
        roles: ['OWNER', 'ADMIN', 'OPERATOR'],
      },
    ],
  },
  {
    label: 'Equipo',
    href: '/team',
    icon: Users2,
    roles: ['OWNER', 'ADMIN'],
  },
  {
    label: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    roles: ['OWNER', 'ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/settings',
    icon: Settings,
    roles: ['OWNER', 'ADMIN', 'OPERATOR', 'EDITOR', 'VIEWER'],
  },
];

const roleNames: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  OPERATOR: 'Operador',
  VIEWER: 'Consulta',
};

export function Sidebar({ identity, onNavigate, className = '' }: SidebarProps) {
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    const [pathPart] = href.split('?');
    if (pathPart === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/workspace';
    }
    return pathname === pathPart || pathname.startsWith(`${pathPart}/`);
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => isCurrent(child.href));
    }
    return isCurrent(item.href);
  };

  const canAccess = (roles?: ('OWNER' | 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'VIEWER')[]) => {
    if (!roles) return true;
    return roles.includes(identity.role);
  };

  return (
    <aside
      className={`flex flex-col h-full bg-[#f8f9fa] text-[#111111] select-none ${className}`}
      aria-label="Barra lateral de administración"
    >
      {/* Top Header: Platform Glyph + Tenant Context (Cal density: pt-2 px-2 py-2) */}
      <div className="pt-2 px-2 py-2">
        <div className="flex items-center gap-2 md:max-lg:justify-center">
          <div
            title={identity.agencyName}
            className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-bold text-xs shadow-none shrink-0 tracking-wider"
          >
            {PRODUCT_SHORT_NAME[0]}
          </div>
          <div className="min-w-0 flex-1 md:max-lg:hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#111111] truncate">
                {identity.agencyName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6b7280] font-mono truncate">
              <Building2 className="w-3 h-3 shrink-0 text-[#898989]" />
              <span>{identity.agencySlug}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation list (Cal geometry: h-8, rounded-lg, text-sm, gap-2, icon size-4) */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 no-scrollbar">
        {navItems
          .filter((item) => canAccess(item.roles))
          .map((item) => {
            const active = isParentActive(item);
            const Icon = item.icon;

            return (
              <div key={item.label} className="space-y-0.5">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={item.label}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={`flex items-center justify-between h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer md:max-lg:justify-center md:max-lg:px-0 ${
                    active
                      ? 'bg-[#f3f4f6] text-[#111111]'
                      : 'text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 md:max-lg:justify-center">
                    <Icon className="w-4 h-4 shrink-0 text-[#6b7280]" />
                    <span className="truncate md:max-lg:sr-only">{item.label}</span>
                  </div>
                  {item.children && (
                    <ChevronDown className="w-3.5 h-3.5 text-[#898989] shrink-0 md:max-lg:hidden" />
                  )}
                </Link>

                {/* Sub-items (expanded in full sidebar lg+ and mobile drawer) */}
                {item.children && active && (
                  <div className="pl-6 pr-1 space-y-0.5 pt-0.5 pb-1 md:max-lg:hidden">
                    {item.children
                      .filter((child) => canAccess(child.roles))
                      .map((child) => {
                        const childActive = isCurrent(child.href);
                        const ChildIcon = child.icon;

                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={onNavigate}
                            title={child.label}
                            aria-current={childActive ? 'page' : undefined}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              childActive
                                ? 'bg-[#f3f4f6] text-[#111111] font-medium'
                                : 'text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6]/40'
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5 text-[#898989]" />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* User Footer: Role badge, email, and Logout */}
      <div className="p-2">
        <div className="flex items-center justify-between gap-2 md:max-lg:flex-col md:max-lg:items-center">
          <div
            className="flex items-center gap-2 min-w-0 md:max-lg:justify-center"
            title={`${identity.email} (${roleNames[identity.role] || identity.role})`}
          >
            <div className="w-7 h-7 rounded-md bg-[#f3f4f6] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
              {identity.email[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 md:max-lg:hidden">
              <p className="text-xs font-medium text-[#111111] truncate">
                {identity.email}
              </p>
              <span className="inline-block text-[10px] font-medium text-[#6b7280] uppercase tracking-wider">
                {roleNames[identity.role] || identity.role}
              </span>
            </div>
          </div>

          <form action={logoutAction} className="md:max-lg:w-full md:max-lg:flex md:max-lg:justify-center">
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
