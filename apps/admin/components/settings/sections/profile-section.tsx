'use client';

import React from 'react';
import { User, Lock } from 'lucide-react';
import type { AgencyProfileData, NavIdentity } from '../types';

export interface ProfileSectionProps {
  initialProfile: AgencyProfileData;
  identity: NavIdentity;
}

export function ProfileSection({ initialProfile, identity }: ProfileSectionProps) {
  const inputClass =
    'h-[34px] mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="product-card-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
          <User className="w-4 h-4 text-[#6b7280]" />
          <span>Cuenta Personal del Operador</span>
        </h3>
        <p className="text-xs text-[#6b7280]">
          Información de sesión y credenciales asociadas a tu usuario en la plataforma.
        </p>

        <div className="pt-3 border-t border-[#e5e7eb] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-lg">
            {identity?.email ? identity.email[0]?.toUpperCase() : 'U'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-semibold text-[#111111] truncate">
              {identity?.email || 'usuario@agencia.com'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f3f4f6] text-[#111111] uppercase tracking-wider">
                Rol: {identity?.role || 'ADMINISTRADOR'}
              </span>
              <span className="text-xs text-[#6b7280]">· Agencia: {identity?.agencyName}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div>
            <label className={labelClass}>ID de Usuario</label>
            <input
              type="text"
              readOnly
              value={identity?.userId || 'usr_0000000000'}
              className={`${inputClass} bg-[#f8f9fa] text-[#6b7280] font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelClass}>ID de Agencia</label>
            <input
              type="text"
              readOnly
              value={identity?.agencyId || initialProfile.id}
              className={`${inputClass} bg-[#f8f9fa] text-[#6b7280] font-mono text-xs`}
            />
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="product-card-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#6b7280]" />
          <span>Seguridad de Contraseña</span>
        </h3>
        <p className="text-xs text-[#6b7280]">
          Mantén tu contraseña protegida con un mínimo de 8 caracteres y símbolos alfanuméricos.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Función de actualización de contraseña lista para conectar con servicio de auth.');
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nueva Contraseña</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className={inputClass}
                minLength={8}
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className={inputClass}
                minLength={8}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="product-button-primary">
              Actualizar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
