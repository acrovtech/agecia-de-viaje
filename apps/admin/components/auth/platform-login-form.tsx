'use client';

import React, { useActionState, useState } from 'react';
import { platformLoginAction } from '../../app/actions/platform-auth';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface PlatformLoginFormProps {
  productName?: string;
  logoUrl?: string | null;
  iconUrl?: string | null;
}

export function PlatformLoginForm({
  productName = 'Plataforma SaaS',
  logoUrl,
  iconUrl,
}: PlatformLoginFormProps) {
  const [state, formAction, isPending] = useActionState(platformLoginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const displayBrandLogo = logoUrl || iconUrl;

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-sm">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary shadow-inner">
          {displayBrandLogo ? (
            <img
              src={displayBrandLogo}
              alt={productName}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <Shield className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-2">
          Control Plane
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {productName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Acceso exclusivo para administradores de la plataforma.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl text-sm bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
          <p className="font-medium leading-relaxed">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="platform-email"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Correo electrónico
          </label>
          <input
            id="platform-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@plataforma.com"
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="platform-password"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="platform-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isPending}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? 'Verificando credenciales...' : 'Ingresar al Control Plane'}
          </button>
        </div>
      </form>
    </div>
  );
}
