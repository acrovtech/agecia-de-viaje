'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Tag,
  Truck,
} from 'lucide-react';
import { TenantAccountCard } from './tenant-account-card';

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

const mainNavItems: NavItem[] = [
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
];

const bottomNavItems: NavItem[] = [
  {
    label: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    roles: ['OWNER', 'ADMIN'],
  },
  {
    label: 'Ajustes',
    href: '/settings',
    icon: Settings,
    roles: ['OWNER', 'ADMIN', 'OPERATOR', 'EDITOR', 'VIEWER'],
  },
];

export function Sidebar({ identity, onNavigate, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click or escape
  useEffect(() => {
    if (!activeFlyout) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveFlyout(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveFlyout(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFlyout]);

  const isCurrent = (href: string) => {
    const [pathPart] = href.split('?');
    if (pathPart === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/workspace';
    }
    if (pathPart === '/settings') {
      return pathname === '/settings' || pathname.startsWith('/settings/');
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

  const handleMouseEnterRail = (label: string) => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setActiveFlyout(label);
  };

  const handleMouseLeaveRail = () => {
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 150);
  };

  return (
    <aside
      ref={containerRef}
      className={`flex flex-col h-full bg-[#f8f9fa] text-[#111111] select-none ${className}`}
      aria-label="Barra lateral de administración"
    >
      {/* Top Header: Account / Agency Card */}
      <div className="pt-2 px-2 py-2 border-b border-transparent">
        <TenantAccountCard identity={identity} onNavigate={onNavigate} variant="responsive" />
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 no-scrollbar">
        {mainNavItems
          .filter((item) => canAccess(item.roles))
          .map((item) => {
            const active = isParentActive(item);
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isFlyoutOpen = activeFlyout === item.label;

            return (
              <div
                key={item.label}
                className="relative space-y-0.5"
                onMouseEnter={() => {
                  if (hasChildren) handleMouseEnterRail(item.label);
                }}
                onMouseLeave={() => {
                  if (hasChildren) handleMouseLeaveRail();
                }}
              >
                {/* 1. Desktop (lg+) and Mobile Drawer Navigation Item */}
                <div className="md:max-lg:hidden">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={item.label}
                    aria-current={isCurrent(item.href) ? 'page' : undefined}
                    className={`flex items-center justify-between h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] ${
                      active
                        ? 'bg-[#f3f4f6] text-[#111111] font-semibold'
                        : 'text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-[#6b7280]" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {hasChildren && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#898989] shrink-0 transition-transform ${
                          active ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </Link>

                  {/* Sub-items (expanded when active on lg+ and mobile drawer) */}
                  {hasChildren && active && (
                    <div className="pl-6 pr-1 space-y-0.5 pt-0.5 pb-1">
                      {item.children!
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
                              className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] ${
                                childActive
                                  ? 'bg-[#f3f4f6] text-[#111111] font-semibold'
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

                {/* 2. Tablet Icon-Rail (md:max-lg): with Nested Flyout on tap / hover / keyboard */}
                <div className="hidden md:max-lg:block">
                  {hasChildren ? (
                    <button
                      type="button"
                      title={item.label}
                      aria-expanded={isFlyoutOpen}
                      aria-haspopup="dialog"
                      onClick={() => setActiveFlyout((prev) => (prev === item.label ? null : item.label))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveFlyout((prev) => (prev === item.label ? null : item.label));
                        }
                      }}
                      className={`w-full flex items-center justify-center h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] ${
                        active
                          ? 'bg-[#f3f4f6] text-[#111111]'
                          : 'text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-[#6b7280]" />
                      <span className="sr-only">{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      aria-current={isCurrent(item.href) ? 'page' : undefined}
                      className={`flex items-center justify-center h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] ${
                        active
                          ? 'bg-[#f3f4f6] text-[#111111]'
                          : 'text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-[#6b7280]" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  )}

                  {/* Tablet Rail Flyout Menu for items with children */}
                  {hasChildren && isFlyoutOpen && (
                    <div
                      role="menu"
                      aria-label={`Submenú ${item.label}`}
                      className="absolute left-full ml-2 top-0 w-52 bg-white border border-[#e5e7eb] rounded-[10px] shadow-product-card p-1.5 z-50 space-y-0.5"
                    >
                      <div className="px-2 py-1 text-[11px] font-semibold text-[#898989] uppercase tracking-wider border-b border-[#f3f4f6] mb-1">
                        {item.label}
                      </div>
                      {item.children!
                        .filter((child) => canAccess(child.roles))
                        .map((child) => {
                          const childActive = isCurrent(child.href);
                          const ChildIcon = child.icon;

                          return (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={() => {
                                setActiveFlyout(null);
                                onNavigate?.();
                              }}
                              title={child.label}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                childActive
                                  ? 'bg-[#f3f4f6] text-[#111111] font-semibold'
                                  : 'text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6]'
                              }`}
                            >
                              <ChildIcon className="w-3.5 h-3.5 text-[#6b7280]" />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </nav>

      {/* Bottom Navigation: Notificaciones & Ajustes */}
      <div className="p-2 border-t border-[#e5e7eb] space-y-0.5">
        {bottomNavItems
          .filter((item) => canAccess(item.roles))
          .map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer md:max-lg:justify-center md:max-lg:px-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] ${
                  active
                    ? 'bg-[#f3f4f6] text-[#111111] font-semibold'
                    : 'text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6]/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 md:max-lg:justify-center">
                  <Icon className="w-4 h-4 shrink-0 text-[#6b7280]" />
                  <span className="truncate md:max-lg:sr-only">{item.label}</span>
                </div>
              </Link>
            );
          })}
      </div>
    </aside>
  );
}
