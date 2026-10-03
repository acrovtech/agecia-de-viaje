'use client';

import React from 'react';
import Image from 'next/image';
import { MessageSquare, Webhook } from 'lucide-react';

function VerifiedShield() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0 inline-block align-middle"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Integración verificada"
    >
      <defs>
        <linearGradient id="bronze-shield" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e5a96a" />
          <stop offset="0.5" stopColor="#b4783a" />
          <stop offset="1" stopColor="#8c4e1a" />
        </linearGradient>
      </defs>
      <path
        d="M8 1.5L2.5 3.8V7.5C2.5 11 4.8 13.9 8 14.8C11.2 13.9 13.5 11 13.5 7.5V3.8L8 1.5Z"
        fill="url(#bronze-shield)"
        stroke="#78350f"
        strokeWidth="0.5"
      />
      <path
        d="M5.5 7.8L7.2 9.5L10.5 6.2"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  badge?: string;
  badgeVariant?: 'amber' | 'purple' | 'neutral';
  logo: React.ReactNode;
  statusLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function IntegrationCard({
  name,
  description,
  badge,
  badgeVariant = 'purple',
  logo,
  statusLabel,
  actionLabel,
  onAction,
}: IntegrationCardProps) {
  return (
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5 flex flex-col justify-between hover:border-[#d1d5db] transition-all group">
      <div>
        {/* Top row: Logo + Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-2xs border border-black/5 flex items-center justify-center bg-[#f8f9fa]">
            {logo}
          </div>
          {badge && (
            <span
              className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${
                badgeVariant === 'amber'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : badgeVariant === 'neutral'
                    ? 'bg-[#f3f4f6] text-[#374151]'
                    : 'bg-[#ede9fe] text-[#6d28d9]'
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Title + Verified Shield */}
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold text-[#111111]">{name}</h4>
          <VerifiedShield />
        </div>

        {/* Description */}
        <p className="text-xs text-[#6b7280] leading-relaxed mt-1.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Action footer */}
      {(actionLabel || statusLabel) && (
        <div className="pt-3.5 mt-3.5 border-t border-[#f3f4f6] flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#6b7280]">
            {statusLabel}
          </span>
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-semibold text-[#111111] hover:text-black hover:underline cursor-pointer transition-colors"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function IntegrationsSection() {
  const paymentIntegrations: IntegrationCardProps[] = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Track how your links are converting to sales on Stripe.',
      logo: (
        <Image
          src="/integrations/stripe.png"
          alt="Stripe"
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ),
      statusLabel: 'Integración prevista',
      actionLabel: 'Conectar cuenta',
      onAction: () => alert('Próximamente: conectar cuenta de Stripe Connect.'),
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Track how your links are converting to sales on Shopify.',
      logo: (
        <div className="w-full h-full bg-[#95bf47] flex items-center justify-center p-1.5 text-white">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M19.34 6.84L14.7.74a.8.8 0 00-.73-.24l-2.45.69-.14-.42A1.73 1.73 0 009.7.02L5.8 1.15a1.73 1.73 0 00-1.2 1.63c0 .1 0 .2.02.3L2.24 6.27a1.08 1.08 0 00-.59.98c0 5.48 3.51 16.03 10.37 16.03 6.85 0 10.36-10.55 10.36-16.03a1.08 1.08 0 00-.63-.98l-2.41-.43zm-8.8-4.47l2.84-.81.65 1.95-3.49 1-.65-1.95a.35.35 0 01.24-.44.35.35 0 01.41.25zm1.53 18.91C6.26 21.28 3.65 12.3 3.65 7.64l8.42 1.5v12.14zm1.48 0V9.14l7.3-1.3c.06 4.46-2.52 13.44-7.3 13.44z" />
          </svg>
        </div>
      ),
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      statusLabel: 'En desarrollo',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con Shopify para sincronización de catálogo de tours en desarrollo.'),
    },
    {
      id: 'polar',
      name: 'Polar',
      description: 'Track how your links are converting to sales on Polar.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-[#0f0f11] flex items-center justify-center p-1.5">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4.5" ry="9" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </div>
      ),
      statusLabel: 'Próximamente',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con Polar en desarrollo.'),
    },
    {
      id: 'izipay',
      name: 'Izipay Pasarela',
      description: 'Tarjetas de crédito y débito Visa, Mastercard y Amex con tokenización segura.',
      badge: 'PROVEEDOR DIFERIDO',
      badgeVariant: 'amber',
      logo: (
        <div className="w-full h-full bg-gradient-to-br from-[#ff0055] to-[#c70044] flex items-center justify-center text-white font-extrabold text-sm tracking-tighter">
          izi
        </div>
      ),
      statusLabel: 'Fase de pago diferida',
      actionLabel: 'Ver estado',
      onAction: () => alert('Pasarela Izipay: integración y activación diferida para siguiente fase.'),
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Cobros locales en moneda nacional y billeteras digitales para América Latina.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-[#009ee3] flex items-center justify-center text-white font-black text-xs tracking-tight">
          MP
        </div>
      ),
      statusLabel: 'Próximamente',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con Mercado Pago programada para la siguiente fase.'),
    },
  ];

  const toolIntegrations: IntegrationCardProps[] = [
    {
      id: 'gcalendar',
      name: 'Google Calendar',
      description: 'Sincroniza salidas de tours y traslados directamente con el calendario de guías.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center border border-[#e5e7eb]">
          <div className="w-full bg-[#4285F4] h-2.5 flex items-center justify-center" />
          <span className="text-[11px] font-bold text-[#4285F4] leading-none pt-0.5">31</span>
        </div>
      ),
      statusLabel: 'Próximamente',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con Google Calendar programada para la siguiente fase.'),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Cloud API',
      description: 'Envío instantáneo de vouchers, confirmación de horarios y recordatorios a viajeros.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-[#25D366] flex items-center justify-center text-white">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
      ),
      statusLabel: 'Próximamente',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con WhatsApp Cloud API en desarrollo.'),
    },
    {
      id: 'webhooks',
      name: 'Webhooks & API',
      description: 'Notificaciones en tiempo real para eventos de reservas, pagos y clientes.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-[#1e293b] flex items-center justify-center text-white">
          <Webhook className="w-5 h-5 text-white" />
        </div>
      ),
      statusLabel: 'Próximamente',
      actionLabel: 'Saber más',
      onAction: () => alert('Webhooks de reservas disponibles en la siguiente fase de API.'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Payments Section (Exact match with reference image) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            Payments
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Conecta pasarelas de cobro y monitorea cómo tus enlaces y tours convierten en ventas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {paymentIntegrations.map((item) => (
            <IntegrationCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      {/* Tools & Automations Section */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            Herramientas y Automatizaciones
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Sincronización con calendarios de conductores, mensajería y webhooks en la nube.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {toolIntegrations.map((item) => (
            <IntegrationCard key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
