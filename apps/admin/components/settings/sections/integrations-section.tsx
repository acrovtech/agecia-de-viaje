'use client';

import React from 'react';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';

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
      id: 'culqi',
      name: 'Culqi Pasarela',
      description: 'Cobros locales con tarjeta Visa, Mastercard y pagos rápidos con Yape en Perú.',
      badge: 'COMING SOON',
      badgeVariant: 'purple',
      logo: (
        <div className="w-full h-full bg-gradient-to-br from-[#00b49f] to-[#008272] flex items-center justify-center text-white font-extrabold text-xs tracking-tight">
          culqi
        </div>
      ),
      statusLabel: 'En desarrollo',
      actionLabel: 'Saber más',
      onAction: () => alert('Integración con Culqi programada para la siguiente fase.'),
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
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Cobros internacionales en USD, EUR y más de 135 monedas globales.',
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
  ];

  return (
    <div className="space-y-8">
      {/* Payments Section */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            Payments
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Conecta pasarelas de cobro con tarjeta y billeteras digitales para confirmar reservas.
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
            Sincronización con calendarios de conductores, guías y mensajería instantánea.
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
