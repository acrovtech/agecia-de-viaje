'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Building2, User, LogOut, ChevronDown } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import type { NavIdentity } from './sidebar';

export interface TenantAccountCardProps {
  identity: NavIdentity;
  onNavigate?: () => void;
  className?: string;
  variant?: 'full' | 'compact' | 'responsive';
}

export function TenantAccountCard({
  identity,
  onNavigate,
  className = '',
  variant = 'responsive',
}: TenantAccountCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initial = identity.agencyName ? identity.agencyName[0]?.toUpperCase() : 'A';

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Account / Agency Card Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={identity.agencyName}
        className={`w-full flex items-center gap-2 p-1.5 rounded-[10px] text-left transition-colors cursor-pointer hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 ${
          variant === 'compact'
            ? 'justify-center p-1'
            : variant === 'responsive'
              ? 'md:max-lg:justify-center md:max-lg:p-1'
              : ''
        }`}
      >
        {/* Black Square Avatar/Glyph with Tenant Initial */}
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider shadow-none"
        >
          {initial}
        </div>

        {/* Agency details (hidden on tablet rail when responsive or compact) */}
        <div
          className={`min-w-0 flex-1 ${
            variant === 'compact'
              ? 'hidden'
              : variant === 'responsive'
                ? 'md:max-lg:hidden'
                : 'block'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-[13px] font-semibold text-[#111111] truncate leading-tight">
              {identity.agencyName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#898989] shrink-0 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280] font-mono truncate leading-tight mt-0.5">
            <Building2 className="w-3 h-3 shrink-0 text-[#898989]" />
            <span className="truncate">{identity.agencySlug}</span>
          </div>
        </div>
      </button>

      {/* Account Popover / Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Menú de cuenta y agencia"
          className={`absolute z-50 w-64 bg-white border border-[#e5e7eb] rounded-[10px] shadow-product-card p-2 space-y-1 ${
            variant === 'compact'
              ? 'left-full ml-2 top-0'
              : variant === 'responsive'
                ? 'left-0 top-full mt-1.5 md:max-lg:left-full md:max-lg:ml-2 md:max-lg:top-0 md:max-lg:mt-0'
                : 'left-0 top-full mt-1.5'
          }`}
        >
          {/* Header Info */}
          <div className="px-2 py-1.5 space-y-0.5 border-b border-[#f3f4f6]">
            <p className="text-xs font-semibold text-[#111111] truncate">
              {identity.agencyName}
            </p>
            <p className="text-[11px] text-[#6b7280] truncate">
              {identity.email}
            </p>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f3f4f6] text-[#374151] uppercase tracking-wider">
                {identity.role}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/settings/profile"
              onClick={() => {
                handleClose();
                onNavigate?.();
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]"
            >
              <User className="w-3.5 h-3.5 text-[#6b7280]" />
              <span>Perfil</span>
            </Link>
          </div>

          {/* Sign Out Form */}
          <div className="pt-1 border-t border-[#f3f4f6]">
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                onClick={handleClose}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
