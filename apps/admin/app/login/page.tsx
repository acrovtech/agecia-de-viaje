'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions/auth';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#062918] via-[#0B4354] to-[#041A10] p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative subtle ambient lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#062918] p-3 shadow-lg shadow-emerald-950/40 mb-4 ring-2 ring-emerald-500/30">
            <Image 
              src="/icon.svg" 
              alt="Inca Bound Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
            />
          </div>
          <h1 className="text-2xl font-bold text-[#0B4354] tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inca Bound · Sistema de Gestión Privado
          </p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Login Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                defaultValue="admin@incabound.com"
                placeholder="correo@incabound.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4354] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contraseña Master
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4354] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-6 bg-[#0B4354] hover:bg-[#083340] active:bg-[#05232c] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#0B4354]/30 hover:shadow-xl hover:shadow-[#0B4354]/40 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Acceso restringido únicamente para personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
}
