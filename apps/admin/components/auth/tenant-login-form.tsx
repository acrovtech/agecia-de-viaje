'use client';

import React, { useState, useActionState } from 'react';
import Image from 'next/image';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import type { PublicAdminLoginContext } from '@/lib/central-api';

export interface TenantLoginFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>;
  agencySlug?: string;
  context: PublicAdminLoginContext;
  isExpired?: boolean;
}

export function TenantLoginForm({ action, context, isExpired }: TenantLoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [showPassword, setShowPassword] = useState(false);

  const { agency, platformBranding } = context;
  const initial = agency.name ? agency.name[0]?.toUpperCase() : 'A';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA] p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        {/* Co-Branded Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            {/* Agency Branding */}
            <div className="flex items-center justify-center">
              {agency.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.logoUrl}
                  alt={agency.name}
                  className="h-10 max-h-10 w-auto max-w-[160px] object-contain"
                />
              ) : agency.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.iconUrl}
                  alt={agency.name}
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-none"
                >
                  {initial}
                </div>
              )}
            </div>

            {/* Divider (only visible if platform branding is enabled) */}
            {platformBranding.enabled && (
              <div
                aria-hidden="true"
                className="hidden sm:block h-7 w-[1px] bg-slate-300"
              />
            )}

            {/* Platform Branding (only visible if platform branding is enabled) */}
            {platformBranding.enabled && (
              <div className="flex items-center justify-center">
                {platformBranding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={platformBranding.logoUrl}
                    alt={platformBranding.productName}
                    className="h-8 max-h-8 w-auto max-w-[140px] object-contain"
                  />
                ) : platformBranding.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={platformBranding.iconUrl}
                    alt={platformBranding.productName}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icon.svg"
                      alt={platformBranding.productName}
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                    <span className="text-xs font-semibold text-slate-700 tracking-tight">
                      {platformBranding.productName}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-[#111111] tracking-tight">
            {agency.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accede a tu panel
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* Expired Session Notice */}
          {isExpired && !state?.error && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Tu sesión anterior expiró. Por favor, vuelve a ingresar tus credenciales.</span>
            </div>
          )}

          {/* Error Alert */}
          {state?.error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Login Form: No editable or hidden agencySlug field */}
          <form action={formAction} className="space-y-4">

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  placeholder="usuario@tuagencia.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-6 bg-[#111111] hover:bg-[#222222] text-white font-semibold text-sm rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isPending ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Acceso restringido para el equipo autorizado de {agency.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
