import Link from 'next/link';
import {
  User,
  Sliders,
  Palette,
  Gift,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Blocks,
  ArrowRight,
} from 'lucide-react';
import type { AgencyProfileData, NavIdentity } from '../types';

export interface OverviewSectionProps {
  initialProfile: AgencyProfileData;
  identity: NavIdentity;
}

export function OverviewSection({ initialProfile, identity }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Top Quick Tenant Banner */}
      <div className="product-card-surface p-5 bg-gradient-to-r from-white to-[#f8f9fa] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-base shadow-product-surface shrink-0">
            {initialProfile.name ? initialProfile.name[0]?.toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#111111]">
                {initialProfile.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] text-white">
                PLAN PRO ACTIVO
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5 font-mono">
              Slug: {initialProfile.slug} · ID: {initialProfile.id.slice(0, 12)}…
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/settings/billing"
            className="product-button-secondary text-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gestionar plan</span>
          </Link>
          <Link
            href="/settings/appearance"
            className="product-button-primary text-xs"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Personalizar marca</span>
          </Link>
        </div>
      </div>

      {/* Grid of Section Cards (Direct Shortcuts with Canonical Links) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Perfil */}
        <Link
          href="/settings/profile"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Perfil de Usuario</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#f3f4f6] text-[#374151]">
                  {identity?.role || 'ACTIVO'}
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Credenciales personales, email de acceso y detalles de tu cuenta de operador.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Configurar cuenta</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 2: General */}
        <Link
          href="/settings/general"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Configuración General</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  UTC-5
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Zona horaria, formato de hora, idioma y correo para el resumen ejecutivo mensual.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Ajustar parámetros</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 3: Aspecto */}
        <Link
          href="/settings/appearance"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Aspecto e Identidad</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f3f4f6] text-[#374151]">
                  2 COLORES
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Paleta corporativa, selector de tema (claro/oscuro) y subida de logotipo y favicon.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Editar diseño</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 4: Gana por Referenciado */}
        <Link
          href="/settings/referrals"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Gana por Referenciado</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  20% RECURRENTE
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Tu enlace de recomendación, dashboard de comisiones y registro de ganancias.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Ver comisiones</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 5: Facturación */}
        <Link
          href="/settings/billing"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Facturación y Créditos</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  PRO
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Gestión de tu suscripción SaaS, historial mensual de gastos y saldo de créditos.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Administrar pagos</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 6: Planes del SaaS */}
        <Link
          href="/settings/plans"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Planes de la Plataforma</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  UPGRADE
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Comparativa de planes Starter, Pro y Enterprise con capacidades y límites.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Explorar planes</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 7: Seguridad y Perfil Legal */}
        <Link
          href="/settings/security/legal"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Seguridad y Perfil Legal</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f3f4f6] text-[#374151]">
                  RUC FISCAL
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Razón social, RUC de 11 dígitos, domicilio tributario y sesiones autorizadas.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Datos fiscales</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 8: Página Social (Link in Bio) */}
        <Link
          href="/settings/social"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Página Social (Bio Link)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-pink-100 text-pink-800">
                  TRAVEL LINK
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Página móvil para Instagram/TikTok con tus mejores tours y botón directo de WhatsApp.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Personalizar bio</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        {/* Card 9: Integraciones */}
        <Link
          href="/settings/integrations"
          className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
              <Blocks className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                <span>Integraciones y Pasarelas</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  IZIPAY ACTIVO
                </span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                Conexión con pasarelas de pago, Google Calendar, WhatsApp Cloud y APIs.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
            <span>Ver integraciones</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
