'use client';

import React, { useState, useActionState } from 'react';
import { MediaUploader } from '../../components/workspace/media-uploader';
import { ConfirmDialog } from '../../components/design-system/confirm-dialog';
import type { NavIdentity } from '../../components/design-system/sidebar';
import {
  updateAgencyProfileAction,
  updateLegalProfileAction,
  type SettingsActionState,
} from './actions';
import {
  LayoutDashboard,
  User,
  Sliders,
  Palette,
  Gift,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Blocks,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Lock,
  ArrowRight,
  TrendingUp,
  Download,
  MessageSquare,
  FileText,
} from 'lucide-react';

export type SettingsTabId =
  | 'resumen'
  | 'perfil'
  | 'general'
  | 'aspecto'
  | 'referidos'
  | 'facturacion'
  | 'planes'
  | 'seguridad'
  | 'social'
  | 'integraciones';

interface AgencyProfileData {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  updatedAt: string;
}

interface LegalProfileData {
  ruc: string;
  legalName: string;
  tradeName: string;
  fiscalAddress: string;
  legalRepresentative: string;
  contactEmail: string;
  contactPhone: string;
  updatedAt: string | null;
}

interface SettingsFormProps {
  initialProfile: AgencyProfileData;
  initialLegal: LegalProfileData;
  canEdit: boolean;
  identity?: NavIdentity;
  initialTab?: string;
}

export function SettingsForm({
  initialProfile,
  initialLegal,
  canEdit,
  identity,
  initialTab = 'resumen',
}: SettingsFormProps) {
  const validTabs: SettingsTabId[] = [
    'resumen',
    'perfil',
    'general',
    'aspecto',
    'referidos',
    'facturacion',
    'planes',
    'seguridad',
    'social',
    'integraciones',
  ];

  const defaultTab = validTabs.includes(initialTab as SettingsTabId)
    ? (initialTab as SettingsTabId)
    : 'resumen';

  const [activeTab, setActiveTab] = useState<SettingsTabId>(defaultTab);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    if (tabId === 'resumen') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabId);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // State for agency profile form
  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateAgencyProfileAction, null);

  // State for legal profile form
  const [legalState, legalAction, isLegalPending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateLegalProfileAction, null);

  // Media URLs for branding
  const [logoUrl, setLogoUrl] = useState(initialProfile.logoUrl || '');
  const [iconUrl, setIconUrl] = useState(initialProfile.iconUrl || '');

  // Theme & Appearance State
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [primaryColor, setPrimaryColor] = useState('#111111');
  const [secondaryColor, setSecondaryColor] = useState('#2563EB');

  // General tab state
  const [timezone, setTimezone] = useState('America/Lima');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [monthlyDigestEnabled, setMonthlyDigestEnabled] = useState(true);
  const [monthlyDigestEmail, setMonthlyDigestEmail] = useState(
    initialProfile.email || identity?.email || ''
  );

  // Referral copy state
  const [copiedReferral, setCopiedReferral] = useState(false);
  const referralLink = `https://platform.travel/ref/${initialProfile.slug || 'agencia'}`;

  // Billing cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [planCancelled, setPlanCancelled] = useState(false);

  // Social page mock state
  const [socialBio, setSocialBio] = useState({
    title: initialProfile.name || 'Agencia de Viajes',
    bio: 'Descubre las mejores experiencias turísticas y traslados privados.',
    whatsapp: initialProfile.phone || '+51 984 000 000',
    whatsappMessage: 'Hola, vi su enlace en redes sociales y deseo cotizar un servicio.',
    instagram: `@${initialProfile.slug || 'agencia'}`,
    tiktok: `@${initialProfile.slug || 'agencia'}`,
    showTours: true,
  });

  const inputClass =
    'h-[34px] mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const tabsConfig: { id: SettingsTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'aspecto', label: 'Aspecto', icon: Palette },
    { id: 'referidos', label: 'Gana por referenciado', icon: Gift },
    { id: 'facturacion', label: 'Facturación', icon: CreditCard },
    { id: 'planes', label: 'Planes', icon: Sparkles },
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
    { id: 'social', label: 'Página social', icon: Smartphone },
    { id: 'integraciones', label: 'Integraciones', icon: Blocks },
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Sub-Navigation Tab Bar */}
      <div className="border-b border-[#e5e7eb] -mt-2 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-white shadow-product-button'
                    : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: RESUMEN (Overview Cards Grid)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'resumen' && (
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
              <button
                type="button"
                onClick={() => handleTabChange('facturacion')}
                className="product-button-secondary text-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Gestionar plan</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('aspecto')}
                className="product-button-primary text-xs"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Personalizar marca</span>
              </button>
            </div>
          </div>

          {/* Grid of Section Cards (Direct Shortcuts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Perfil */}
            <div
              onClick={() => handleTabChange('perfil')}
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
            </div>

            {/* Card 2: General */}
            <div
              onClick={() => handleTabChange('general')}
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
            </div>

            {/* Card 3: Aspecto */}
            <div
              onClick={() => handleTabChange('aspecto')}
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
                    Temas visuales (Claro / Oscuro / Sistema), 2 colores de marca, logotipo y favicon.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Editar diseño</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 4: Gana por Referenciado */}
            <div
              onClick={() => handleTabChange('referidos')}
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
                      20% COMISIÓN
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Comparte tu enlace de recomendación, revisa clics, agencias activas y cobro de comisiones.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Ver dashboard de afiliados</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 5: Facturación */}
            <div
              onClick={() => handleTabChange('facturacion')}
              className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                    <span>Facturación y Créditos</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      750 CRÉDITOS
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Suscripción activa, control de cancelación, recarga de créditos y registro de gastos mensual.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Administrar pagos</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 6: Planes del SaaS */}
            <div
              onClick={() => handleTabChange('planes')}
              className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                    <span>Planes del SaaS</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#111111] text-white">
                      PRO
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Comparativa de tiers de la plataforma (Starter, Pro, Enterprise) y opciones de upgrade.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Explorar planes</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 7: Seguridad y Perfil Legal */}
            <div
              onClick={() => handleTabChange('seguridad')}
              className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                    <span>Seguridad y Perfil Legal</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      RUC VERIFICADO
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Razón social, RUC/NIT, domicilio fiscal, sesiones activas y políticas de autenticación.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Gestionar seguridad</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 8: Página Social (Link in Bio) */}
            <div
              onClick={() => handleTabChange('social')}
              className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                    <span>Página Social</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      LINK IN BIO
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Vitrina móvil tipo Beacons con cards de tours destacados, WhatsApp directo y redes sociales.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Personalizar bio</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 9: Integraciones */}
            <div
              onClick={() => handleTabChange('integraciones')}
              className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors">
                  <Blocks className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                    <span>Integraciones</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      IZIPAY ACTIVO
                    </span>
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    Pasarelas de cobro online, Google Calendar, WhatsApp Business Cloud y webhooks.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
                <span>Ver conexiones</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: PERFIL (User Account)                                             */}
      {/* ========================================================================= */}
      {activeTab === 'perfil' && (
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
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: GENERAL (Language, Timezone, Time Format, Digest, Company Contact) */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-3xl">
          {/* Card: Parámetros del Sistema */}
          <div className="product-card-surface p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#6b7280]" />
                <span>Preferencias Regionales y del Sistema</span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Configura idioma, huso horario oficial para el despacho y recepción de resúmenes.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
              {/* Idioma */}
              <div>
                <label className={labelClass}>
                  Idioma de la Plataforma
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                  className={inputClass}
                >
                  <option value="es">Español (Predeterminado)</option>
                  <option value="en" disabled>English (Próximamente)</option>
                </select>
                <p className="text-[11px] text-[#898989] mt-1">
                  La interfaz operativa y los comprobantes se emitirán en el idioma elegido.
                </p>
              </div>

              {/* Zona Horaria */}
              <div>
                <label className={labelClass}>
                  Zona Horaria (Timezone)
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputClass}
                >
                  <option value="America/Lima">America/Lima (UTC-05:00 - Perú)</option>
                  <option value="America/Bogota">America/Bogota (UTC-05:00 - Colombia)</option>
                  <option value="America/Mexico_City">America/Mexico_City (UTC-06:00 - México)</option>
                  <option value="America/Santiago">America/Santiago (UTC-04:00 - Chile)</option>
                  <option value="America/Buenos_Aires">America/Buenos_Aires (UTC-03:00 - Argentina)</option>
                  <option value="UTC">UTC (Tiempo Universal Coordinado)</option>
                </select>
                <p className="text-[11px] text-[#898989] mt-1">
                  Afecta el cálculo de fechas de despacho y horarios de recogida de traslados.
                </p>
              </div>
            </div>

            {/* Formato de Hora */}
            <div className="pt-2">
              <label className={labelClass}>Formato de Visualización de Hora</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5 max-w-sm">
                <button
                  type="button"
                  onClick={() => setTimeFormat('12h')}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                    timeFormat === '12h'
                      ? 'border-[#111111] bg-[#f8f9fa] text-[#111111] shadow-product-card'
                      : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <span>12 Horas (AM / PM)</span>
                  {timeFormat === '12h' && <Check className="w-3.5 h-3.5 text-[#111111]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFormat('24h')}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                    timeFormat === '24h'
                      ? 'border-[#111111] bg-[#f8f9fa] text-[#111111] shadow-product-card'
                      : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <span>24 Horas (14:30)</span>
                  {timeFormat === '24h' && <Check className="w-3.5 h-3.5 text-[#111111]" />}
                </button>
              </div>
            </div>

            {/* Correo de Resumen Mensual */}
            <div className="pt-3 border-t border-[#e5e7eb] space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">
                    Correo Electrónico de Resumen Mensual
                  </h4>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Recibe un informe ejecutivo el primer día de cada mes con el volumen de reservas, ingresos y gastos.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={monthlyDigestEnabled}
                    onChange={(e) => setMonthlyDigestEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#e5e7eb] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#e5e7eb] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
                </label>
              </div>

              {monthlyDigestEnabled && (
                <div className="max-w-md pt-1">
                  <label className={labelClass}>Email Destinatario del Resumen</label>
                  <input
                    type="email"
                    value={monthlyDigestEmail}
                    onChange={(e) => setMonthlyDigestEmail(e.target.value)}
                    placeholder="gerencia@agencia.com"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card: Datos de Contacto de la Empresa */}
          <form action={profileAction} className="product-card-surface p-5 space-y-4">
            <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <input type="hidden" name="iconUrl" value={iconUrl} />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6b7280]" />
                  <span>Información Comercial de la Empresa</span>
                </h3>
                <p className="text-xs text-[#6b7280]">
                  Nombre comercial, teléfonos y datos de atención pública para clientes y reservas.
                </p>
              </div>
            </div>

            {profileState?.success && (
              <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Información general actualizada exitosamente.</span>
              </p>
            )}

            {profileState?.error && (
              <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>{profileState.error}</span>
              </p>
            )}

            <fieldset disabled={isProfilePending || !canEdit} className="space-y-4 pt-2">
              <div>
                <label className={labelClass}>
                  Nombre Comercial de la Agencia <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={initialProfile.name}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Teléfono de Contacto Comercial</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={initialProfile.phone || ''}
                    placeholder="+51 984 000 000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Correo Electrónico de Contacto</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={initialProfile.email || ''}
                    placeholder="contacto@agencia.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Dirección Comercial / Oficina Física</label>
                <input
                  name="address"
                  type="text"
                  defaultValue={initialProfile.address || ''}
                  placeholder="Av. El Sol 123, Of. 402, Cusco, Perú"
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending || !canEdit}
                  className="product-button-primary"
                >
                  {isProfilePending ? 'Guardando cambios…' : 'Guardar datos de contacto'}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: ASPECTO (Themes, 2 Colors, Logo, Favicon)                         */}
      {/* ========================================================================= */}
      {activeTab === 'aspecto' && (
        <form action={profileAction} className="space-y-6 max-w-3xl">
          <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
          <input type="hidden" name="name" value={initialProfile.name} />
          <input type="hidden" name="phone" value={initialProfile.phone || ''} />
          <input type="hidden" name="email" value={initialProfile.email || ''} />
          <input type="hidden" name="address" value={initialProfile.address || ''} />
          <input type="hidden" name="logoUrl" value={logoUrl} />
          <input type="hidden" name="iconUrl" value={iconUrl} />

          {profileState?.success && (
            <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
              <span>Aspecto e identidad visual guardados con éxito.</span>
            </p>
          )}

          {/* Selector de Tema */}
          <div className="product-card-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#6b7280]" />
                <span>Tema de la Interfaz</span>
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Selecciona la apariencia preferida para el panel de administración.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  themeMode === 'system'
                    ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                    : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <div>
                  <div className="h-10 rounded-lg bg-gradient-to-r from-white to-gray-200 border border-[#e5e7eb] mb-2.5 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-gray-500 font-semibold">AUTO</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#111111]">Predeterminado</h4>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Modo actual según configuración de tu navegador.
                  </p>
                </div>
                {themeMode === 'system' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                    <Check className="w-3 h-3" /> Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  themeMode === 'light'
                    ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                    : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <div>
                  <div className="h-10 rounded-lg bg-white border border-[#e5e7eb] mb-2.5 flex items-center justify-center shadow-xs">
                    <span className="text-[10px] font-mono text-gray-800 font-semibold">LIGHT</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#111111]">Claro (Light)</h4>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Superficie blanca limpia con contraste neutral.
                  </p>
                </div>
                {themeMode === 'light' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                    <Check className="w-3 h-3" /> Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  themeMode === 'dark'
                    ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                    : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <div>
                  <div className="h-10 rounded-lg bg-[#161616] border border-[#262626] mb-2.5 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-gray-200 font-semibold">DARK</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#111111]">Oscuro (Dark)</h4>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    Modo oscuro para ambientes de baja luminosidad.
                  </p>
                </div>
                {themeMode === 'dark' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                    <Check className="w-3 h-3" /> Activo
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Identidad de Marca: 2 Colores */}
          <div className="product-card-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">
                Identidad de Marca (2 Colores Principales)
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Por el momento permitimos definir 2 colores canónicos que personalizarán tus vouchers y vitrina pública.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
              <div className="space-y-2">
                <label className={labelClass}>Color Primario (Botones y Enlaces)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#e5e7eb] cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={`${inputClass} font-mono uppercase`}
                    maxLength={7}
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#6b7280]">Presets:</span>
                  {['#111111', '#0B4354', '#1E3A8A', '#065F46', '#831843'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Color Secundario / Acento (Badges y Destacados)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#e5e7eb] cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className={`${inputClass} font-mono uppercase`}
                    maxLength={7}
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#6b7280]">Presets:</span>
                  {['#2563EB', '#0D9488', '#F59E0B', '#E11D48', '#7C3AED'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSecondaryColor(c)}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] flex items-center justify-between">
              <span className="text-xs text-[#6b7280]">Vista previa de combinación:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white shadow-xs"
                >
                  Botón Primario
                </button>
                <span
                  style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor, borderColor: `${secondaryColor}40` }}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold border"
                >
                  Badge Acento
                </span>
              </div>
            </div>
          </div>

          {/* Logotipo y Favicon */}
          <div className="product-card-surface p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">
                Logotipo y Favicon de la Agencia
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Archivos gráficos utilizados en la cabecera del portal y en la pestaña del navegador.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#e5e7eb]">
              <MediaUploader
                name="logoUrlUploader"
                label="Logotipo Principal de la Agencia"
                kind="AGENCY_LOGO"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                helpText="Recomendado: formato SVG o PNG transparente (mínimo 400x120 px)."
              />

              <MediaUploader
                name="iconUrlUploader"
                label="Icono / Favicon (Pestaña del Navegador)"
                kind="AGENCY_ICON"
                value={iconUrl}
                onChange={(url) => setIconUrl(url)}
                helpText="Recomendado: formato PNG cuadrado o ICO (64x64 px o 128x128 px)."
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isProfilePending || !canEdit}
                className="product-button-primary"
              >
                {isProfilePending ? 'Guardando cambios…' : 'Guardar identidad y aspecto'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: GANA POR REFERENCIADO (Affiliates & Referrals)                     */}
      {/* ========================================================================= */}
      {activeTab === 'referidos' && (
        <div className="space-y-6 max-w-4xl">
          <div className="product-card-surface p-6 bg-gradient-to-br from-[#111111] to-[#242424] text-white">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-400 text-black">
                <Gift className="w-3 h-3" /> PROGRAMA OFICIAL DE PARTNERS
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Gana hasta 20% de comisión recurrente por cada agencia referida
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Recomienda la plataforma a operadores turísticos y agencias amigas. Recibe ingresos mensuales continuos durante todo el tiempo que mantengan su suscripción activa.
              </p>
            </div>
          </div>

          <div className="product-card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#111111]">
              Tu Enlace Único de Recomendación
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className={`${inputClass} mt-0 font-mono text-xs select-all bg-[#f8f9fa]`}
              />
              <button
                type="button"
                onClick={copyReferralLink}
                className="product-button-primary shrink-0 gap-1.5"
              >
                {copiedReferral ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#6b7280]">
              Cualquier registro que ingrese por este enlace quedará automáticamente atribuido a tu cuenta.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="product-card-surface p-4 space-y-1">
              <span className="text-[11px] font-medium text-[#6b7280]">Clics en Enlace</span>
              <p className="text-xl font-bold text-[#111111]">148</p>
              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14% este mes
              </span>
            </div>
            <div className="product-card-surface p-4 space-y-1">
              <span className="text-[11px] font-medium text-[#6b7280]">Agencias Registradas</span>
              <p className="text-xl font-bold text-[#111111]">8</p>
              <span className="text-[10px] text-[#6b7280]">3 en prueba gratuita</span>
            </div>
            <div className="product-card-surface p-4 space-y-1">
              <span className="text-[11px] font-medium text-[#6b7280]">Ganancias Acumuladas</span>
              <p className="text-xl font-bold text-[#111111]">$240.00</p>
              <span className="text-[10px] text-emerald-600">USD facturados</span>
            </div>
            <div className="product-card-surface p-4 space-y-1">
              <span className="text-[11px] font-medium text-[#6b7280]">Disponible para Retiro</span>
              <p className="text-xl font-bold text-emerald-700">$160.00</p>
              <button
                type="button"
                onClick={() => alert('Próximamente: solicitud de desembolso vía transferencia bancaria o PayPal.')}
                className="text-[10px] font-semibold text-[#111111] hover:underline"
              >
                Solicitar retiro →
              </button>
            </div>
          </div>

          <div className="product-card-surface overflow-hidden">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
                Actividad Reciente de Agencias Referidas
              </h4>
              <span className="text-xs text-[#6b7280]">Últimas conversiones</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Agencia / Tenant</th>
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Plan Contratado</th>
                    <th className="px-4 py-2.5">Comisión Mensual</th>
                    <th className="px-4 py-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  <tr className="product-data-row">
                    <td className="font-semibold text-[#111111]">Andes Explorer Travel</td>
                    <td className="text-[#6b7280]">hace 4 días</td>
                    <td>Plan Pro ($59/mes)</td>
                    <td className="text-emerald-700 font-semibold">$11.80 / mes</td>
                    <td className="text-right">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activo
                      </span>
                    </td>
                  </tr>
                  <tr className="product-data-row">
                    <td className="font-semibold text-[#111111]">Cusco Sacred Expeditions</td>
                    <td className="text-[#6b7280]">hace 12 días</td>
                    <td>Plan Enterprise ($149/mes)</td>
                    <td className="text-emerald-700 font-semibold">$29.80 / mes</td>
                    <td className="text-right">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activo
                      </span>
                    </td>
                  </tr>
                  <tr className="product-data-row">
                    <td className="font-semibold text-[#111111]">Machu Picchu Direct</td>
                    <td className="text-[#6b7280]">hace 18 días</td>
                    <td>Plan Starter ($29/mes)</td>
                    <td className="text-emerald-700 font-semibold">$5.80 / mes</td>
                    <td className="text-right">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Activo
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: FACTURACIÓN (Billing, Disable/Cancel, Credits, Monthly Log)       */}
      {/* ========================================================================= */}
      {activeTab === 'facturacion' && (
        <div className="space-y-6 max-w-4xl">
          <div className="product-card-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                  Suscripción Actual
                </span>
                <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
                  <span>Plan Pro Crecimiento</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {planCancelled ? 'CANCELACIÓN PROGRAMADA' : 'ACTIVO'}
                  </span>
                </h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  $59.00 USD / mes · Próxima renovación: 28 de Octubre, 2026
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!planCancelled ? (
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="product-button-secondary text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    Deshabilitar o cancelar plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlanCancelled(false)}
                    className="product-button-primary"
                  >
                    Reactivar suscripción
                  </button>
                )}
              </div>
            </div>

            {planCancelled && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Tu plan se encuentra en período de gracia. Mantendrás el acceso a todas las funcionalidades hasta el término del ciclo de facturación.
                </span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3 text-xs pt-1">
              <div>
                <span className="text-[#6b7280] block text-[11px]">Método de Pago:</span>
                <span className="font-semibold text-[#111111]">Visa terminada en •••• 4242</span>
              </div>
              <div>
                <span className="text-[#6b7280] block text-[11px]">Facturado a:</span>
                <span className="font-semibold text-[#111111]">{initialProfile.name}</span>
              </div>
              <div>
                <span className="text-[#6b7280] block text-[11px]">Estado del Cobro:</span>
                <span className="font-semibold text-emerald-700">Al día sin cargos pendientes</span>
              </div>
            </div>
          </div>

          <div className="product-card-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Créditos de la Plataforma</span>
                </h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Utilizados para cotizaciones automáticas, notificaciones transaccionales y herramientas avanzadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Próximamente: recarga de paquetes de 500 y 1,000 créditos.')}
                className="product-button-secondary text-xs"
              >
                Recargar créditos
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#111111]">Saldo restante: 750 créditos</span>
                <span className="text-[#6b7280]">Límite mensual: 1,000 créditos</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                <div className="h-full bg-[#111111] rounded-full w-3/4"></div>
              </div>
              <p className="text-[11px] text-[#898989]">
                Se renovarán automáticamente 1,000 créditos al inicio del siguiente ciclo de facturación.
              </p>
            </div>
          </div>

          <div className="product-card-surface overflow-hidden">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#111111]">
                  Registro de Gastos y Facturación Mensual
                </h4>
                <p className="text-xs text-[#6b7280]">
                  Histórico de recibos emitidos por el uso de la plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Generando reporte consolidado en PDF…')}
                className="product-button-secondary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar historial</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Factura / ID</th>
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Concepto</th>
                    <th className="px-4 py-2.5">Importe</th>
                    <th className="px-4 py-2.5 text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  <tr className="product-data-row">
                    <td className="font-mono text-[#111111]">INV-2026-0901</td>
                    <td className="text-[#6b7280]">01 Sep, 2026</td>
                    <td>Suscripción Mensual - Plan Pro</td>
                    <td className="font-semibold text-[#111111]">$59.00 USD</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => alert('Descargando comprobante INV-2026-0901.pdf')}
                        className="text-xs text-[#111111] hover:underline"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                  <tr className="product-data-row">
                    <td className="font-mono text-[#111111]">INV-2026-0801</td>
                    <td className="text-[#6b7280]">01 Ago, 2026</td>
                    <td>Suscripción Mensual - Plan Pro</td>
                    <td className="font-semibold text-[#111111]">$59.00 USD</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => alert('Descargando comprobante INV-2026-0801.pdf')}
                        className="text-xs text-[#111111] hover:underline"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                  <tr className="product-data-row">
                    <td className="font-mono text-[#111111]">INV-2026-0701</td>
                    <td className="text-[#6b7280]">01 Jul, 2026</td>
                    <td>Suscripción Mensual - Plan Pro</td>
                    <td className="font-semibold text-[#111111]">$59.00 USD</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => alert('Descargando comprobante INV-2026-0701.pdf')}
                        className="text-xs text-[#111111] hover:underline"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <ConfirmDialog
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onConfirm={() => {
              setPlanCancelled(true);
              setCancelModalOpen(false);
            }}
            title="¿Deseas deshabilitar o cancelar tu plan actual?"
            description="Al cancelar la suscripción, mantendrás acceso completo hasta la fecha de expiración del ciclo actual (28 de Octubre, 2026). Posteriormente tu agencia pasará al plan gratuito con límites de catálogo."
            confirmLabel="Confirmar cancelación"
            cancelLabel="Mantener suscripción"
            isDestructive={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: PLANES DEL SAAS (Comparison Matrix)                               */}
      {/* ========================================================================= */}
      {activeTab === 'planes' && (
        <div className="space-y-6 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h3 className="text-lg font-bold text-[#111111]">
              Planes Diseñados para Escalar tu Agencia de Viajes
            </h3>
            <p className="text-xs text-[#6b7280]">
              Elige el nivel de capacidad operativa y canales de venta que mejor se adapte a tu crecimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="product-card-surface p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-[#111111]">Starter</h4>
                  <p className="text-xs text-[#6b7280] mt-1">Para operadores y guías independientes.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#111111]">$29</span>
                  <span className="text-xs text-[#6b7280]">USD / mes</span>
                </div>
                <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta 15 tours publicados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 cuenta de operador</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pasarela de pagos Izipay</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Soporte por ticket</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => alert('Seleccionar plan Starter')}
                className="product-button-secondary w-full"
              >
                Cambiar a Starter
              </button>
            </div>

            <div className="product-card-surface p-6 border-2 border-[#111111] relative flex flex-col justify-between space-y-5 bg-[#f8f9fa]/30">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-white">
                PLAN ACTUAL
              </span>
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-[#111111]">Pro Crecimiento</h4>
                  <p className="text-xs text-[#6b7280] mt-1">Para agencias de turismo en expansión.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#111111]">$59</span>
                  <span className="text-xs text-[#6b7280]">USD / mes</span>
                </div>
                <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[#111111]">Tours y traslados ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Despacho y asignación de flota</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta 5 operadores de equipo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Página social (Link in Bio)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Soporte prioritario</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                disabled
                className="w-full h-8 rounded-lg bg-[#e5e7eb] text-[#374151] text-xs font-semibold cursor-default"
              >
                Plan Activo
              </button>
            </div>

            <div className="product-card-surface p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-[#111111]">Enterprise</h4>
                  <p className="text-xs text-[#6b7280] mt-1">Para grandes agencias y mayoristas.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#111111]">$149</span>
                  <span className="text-xs text-[#6b7280]">USD / mes</span>
                </div>
                <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[#111111]">Todo lo del Plan Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dominio personalizado con SSL</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Operadores de equipo ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Acceso a API y webhooks en vivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>SLA 99.9% y Onboarding dedicado</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => alert('Mejorar a Enterprise: te conectaremos con un asesor.')}
                className="product-button-primary w-full"
              >
                Mejorar a Enterprise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB: SEGURIDAD (Legal Profile, Tax ID, Sessions Audit)                  */}
      {/* ========================================================================= */}
      {activeTab === 'seguridad' && (
        <div className="space-y-6 max-w-3xl">
          <form action={legalAction} className="product-card-surface p-5 space-y-4">
            <input
              type="hidden"
              name="expectedUpdatedAt"
              value={initialLegal.updatedAt || ''}
            />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#6b7280]" />
                  <span>Perfil Legal y Fiscal de la Empresa</span>
                </h3>
                <p className="text-xs text-[#6b7280]">
                  Datos constitutivos requeridos para facturación electrónica y cumplimiento tributario.
                </p>
              </div>
            </div>

            {legalState?.success && (
              <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Perfil legal actualizado exitosamente.</span>
              </p>
            )}

            {legalState?.error && (
              <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>{legalState.error}</span>
              </p>
            )}

            <fieldset disabled={isLegalPending || !canEdit} className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    RUC / Identificador Fiscal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="ruc"
                    type="text"
                    required
                    pattern="^\d{11}$"
                    maxLength={11}
                    defaultValue={initialLegal.ruc}
                    placeholder="20600000001"
                    className={`${inputClass} font-mono`}
                  />
                  <p className="text-[11px] text-[#898989] mt-0.5">Exactamente 11 dígitos numéricos.</p>
                </div>

                <div>
                  <label className={labelClass}>
                    Razón Social Completa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="legalName"
                    type="text"
                    required
                    defaultValue={initialLegal.legalName}
                    placeholder="Agencia de Viajes y Turismo S.A.C."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Nombre Comercial Registrado</label>
                <input
                  name="tradeName"
                  type="text"
                  defaultValue={initialLegal.tradeName || ''}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Domicilio Fiscal Oficial <span className="text-rose-500">*</span>
                </label>
                <input
                  name="fiscalAddress"
                  type="text"
                  required
                  defaultValue={initialLegal.fiscalAddress}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Representante Legal</label>
                  <input
                    name="legalRepresentative"
                    type="text"
                    defaultValue={initialLegal.legalRepresentative || ''}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email de Notificación Fiscal</label>
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={initialLegal.contactEmail || ''}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Teléfono Legal</label>
                  <input
                    name="contactPhone"
                    type="tel"
                    defaultValue={initialLegal.contactPhone || ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isLegalPending || !canEdit}
                  className="product-button-primary"
                >
                  {isLegalPending ? 'Guardando datos legales…' : 'Guardar perfil legal'}
                </button>
              </div>
            </fieldset>
          </form>

          <div className="product-card-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6b7280]" />
              <span>Auditoría de Sesiones y Accesos</span>
            </h3>
            <p className="text-xs text-[#6b7280]">
              Dispositivos autenticados actualmente en tu cuenta.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <span className="font-semibold text-[#111111] block">Navegador Actual (Windows · Chrome)</span>
                    <span className="text-[#6b7280]">Conexión activa ahora · IP verificada</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ESTA SESIÓN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB: PÁGINA SOCIAL (Travel Link in Bio - Beacons Style)                */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <div className="space-y-6 max-w-5xl">
          <div className="product-card-surface p-4 bg-sky-50 border-sky-200 text-sky-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Smartphone className="w-4 h-4 text-sky-700 shrink-0" />
              <span>
                <strong>Página Social Móvil (Travel Link in Bio)</strong> — Optimizado para Instagram, TikTok y WhatsApp. Tus clientes podrán cotizar tours y contactarte con 1 clic.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900 uppercase tracking-wider shrink-0">
              PRÓXIMAMENTE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="product-card-surface p-5 space-y-4">
                <h4 className="text-sm font-semibold text-[#111111]">
                  Personalización del Link in Bio
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Enlace Público de tu Bio</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#6b7280] font-mono">travel.bio/</span>
                      <input
                        type="text"
                        value={initialProfile.slug}
                        readOnly
                        className={`${inputClass} mt-0 font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Título Principal de la Bio</label>
                    <input
                      type="text"
                      value={socialBio.title}
                      onChange={(e) => setSocialBio({ ...socialBio, title: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Descripción / Subtítulo</label>
                    <textarea
                      rows={2}
                      value={socialBio.bio}
                      onChange={(e) => setSocialBio({ ...socialBio, bio: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-[#e5e7eb] p-2.5 text-xs text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Botón Directo de WhatsApp</label>
                    <input
                      type="text"
                      value={socialBio.whatsapp}
                      onChange={(e) => setSocialBio({ ...socialBio, whatsapp: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Mensaje Predeterminado de WhatsApp</label>
                    <input
                      type="text"
                      value={socialBio.whatsappMessage}
                      onChange={(e) => setSocialBio({ ...socialBio, whatsappMessage: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <div>
                      <label className={labelClass}>Instagram Handle</label>
                      <input
                        type="text"
                        value={socialBio.instagram}
                        onChange={(e) => setSocialBio({ ...socialBio, instagram: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>TikTok Handle</label>
                      <input
                        type="text"
                        value={socialBio.tiktok}
                        onChange={(e) => setSocialBio({ ...socialBio, tiktok: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => alert('Página social guardada exitosamente.')}
                    className="product-button-primary"
                  >
                    Guardar página social
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[300px] h-[580px] rounded-[38px] border-4 border-[#111111] bg-white shadow-2xl p-4 flex flex-col justify-between overflow-hidden relative">
                <div className="w-24 h-4 bg-[#111111] rounded-b-xl mx-auto -mt-4 mb-3"></div>

                <div className="text-center space-y-2 flex-1">
                  <div className="w-16 h-16 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                    {socialBio.title[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#111111]">{socialBio.title}</h5>
                    <p className="text-[10px] text-[#6b7280] leading-tight mt-0.5 max-w-[220px] mx-auto">
                      {socialBio.bio}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Escribir por WhatsApp</span>
                    </button>
                  </div>

                  <div className="pt-3 space-y-2 text-left">
                    <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                      Tours Destacados
                    </span>
                    <div className="p-2 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-semibold text-[#111111] block">City Tour Cusco</span>
                        <span className="text-[10px] text-[#6b7280]">Medio día · Guía oficial</span>
                      </div>
                      <span className="font-bold text-[#111111]">$40</span>
                    </div>
                    <div className="p-2 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-semibold text-[#111111] block">Valle Sagrado VIP</span>
                        <span className="text-[10px] text-[#6b7280]">Día completo · Almuerzo</span>
                      </div>
                      <span className="font-bold text-[#111111]">$85</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-center gap-3 text-xs text-[#6b7280]">
                  <span>{socialBio.instagram}</span>
                  <span>·</span>
                  <span>{socialBio.tiktok}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. TAB: INTEGRACIONES (Gateways, Google Calendar, WhatsApp API, Webhooks) */}
      {/* ========================================================================= */}
      {activeTab === 'integraciones' && (
        <div className="space-y-6 max-w-4xl">
          <div className="product-card-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">
                Pasarelas de Pago y Cobro Online
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Conecta proveedores de cobro con tarjeta para confirmar reservas de manera automática.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#e5e7eb]">
              <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    IZI
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Izipay Pasarela</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        CONECTADO
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      Tarjetas de crédito y débito Visa, Mastercard, Diners, Amex con tokenización segura.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Parámetros de Izipay configurados a través de variables de entorno de producción.')}
                  className="product-button-secondary text-xs"
                >
                  Configurar claves
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    STR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Stripe Payments</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f3f4f6] text-[#374151]">
                        DISPONIBLE
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      Cobros internacionales en USD, EUR y más de 135 monedas globales.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Próximamente: conectar cuenta de Stripe Connect.')}
                  className="product-button-primary text-xs"
                >
                  Conectar cuenta
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
                    MP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Mercado Pago</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                        PRÓXIMAMENTE
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      Cobros locales y billeteras digitales para América Latina.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="product-card-surface p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">
                Herramientas y Automatizaciones Conectadas
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Sincronización con calendarios de conductores, mensajería y webhooks.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#e5e7eb]">
              <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    CAL
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Google Calendar</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        PRÓXIMAMENTE
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      Sincroniza salidas de tours y traslados directamente con el calendario de tus guías y choferes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Integración con Google Calendar programada para la siguiente fase.')}
                  className="product-button-secondary text-xs"
                >
                  Saber más
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    WSP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">WhatsApp Business Cloud API</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        PRÓXIMAMENTE
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      Envío instantáneo de vouchers, confirmación de horarios de recojo y recordatorios a viajeros.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Integración con WhatsApp Cloud API en desarrollo.')}
                  className="product-button-secondary text-xs"
                >
                  Saber más
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
