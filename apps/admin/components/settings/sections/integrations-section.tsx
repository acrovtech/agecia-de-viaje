'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, MessageSquare } from 'lucide-react';
import type { SafeIntegrationCapability } from '@/lib/integration-capabilities';

export interface IntegrationCardProps {
  id: string;
  name: string;
  badge: string;
  badgeVariant?: 'amber' | 'purple' | 'neutral' | 'emerald';
  logo: React.ReactNode;
  // Future interaction contract (prepared for future connection flows, inactive today)
  connectHref?: string;
  onConnect?: () => void;
  connectionState?: 'disconnected' | 'connecting' | 'connected';
}

function IntegrationCard({
  name,
  badge,
  badgeVariant = 'neutral',
  logo,
}: IntegrationCardProps) {
  return (
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-4 sm:p-5 flex flex-col justify-between h-[112px] transition-colors cursor-default hover:border-[#d1d5db]">
      {/* Top row: Provider icon on left, status badge on right */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/5 flex items-center justify-center bg-[#f8f9fa] shadow-2xs">
          {logo}
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${
            badgeVariant === 'amber'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : badgeVariant === 'purple'
                ? 'bg-[#ede9fe] text-[#6d28d9]'
                : badgeVariant === 'emerald'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-[#f3f4f6] text-[#374151]'
          }`}
        >
          {badge}
        </span>
      </div>

      {/* Bottom: Provider name */}
      <div className="flex items-center gap-1.5">
        <h4 className="text-sm font-semibold text-[#111111]">{name}</h4>
      </div>
    </div>
  );
}

export interface IntegrationsSectionProps {
  capabilities?: SafeIntegrationCapability[];
}

export function IntegrationsSection({ capabilities = [] }: IntegrationsSectionProps) {
  const getCap = (id: string) => capabilities.find((c) => c.id === id);

  const izipayCap = getCap('izipay');
  const culqiCap = getCap('culqi');
  const mercadopagoCap = getCap('mercadopago');
  const stripeCap = getCap('stripe');
  const gcalendarCap = getCap('gcalendar');
  const whatsappCap = getCap('whatsapp');

  const paymentIntegrations: IntegrationCardProps[] = [
    {
      id: 'izipay',
      name: 'Izipay Pasarela',
      badge: izipayCap?.statusLabel || 'Proveedor diferido',
      badgeVariant: izipayCap?.badgeVariant || 'amber',
      logo: (
        <div className="w-full h-full bg-gradient-to-br from-[#ff0055] to-[#c70044] flex items-center justify-center text-white font-extrabold text-sm tracking-tighter">
          izi
        </div>
      ),
    },
    {
      id: 'culqi',
      name: 'Culqi Pasarela',
      badge: culqiCap?.statusLabel || 'Próximamente',
      badgeVariant: culqiCap?.badgeVariant || 'purple',
      logo: (
        <div className="w-full h-full bg-gradient-to-br from-[#00b49f] to-[#008272] flex items-center justify-center text-white font-extrabold text-xs tracking-tight">
          culqi
        </div>
      ),
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      badge: mercadopagoCap?.statusLabel || 'Próximamente',
      badgeVariant: mercadopagoCap?.badgeVariant || 'purple',
      logo: (
        <div className="w-full h-full bg-[#009ee3] flex items-center justify-center text-white font-black text-xs tracking-tight">
          MP
        </div>
      ),
    },
    {
      id: 'stripe',
      name: 'Stripe',
      badge: stripeCap?.statusLabel || 'No disponible',
      badgeVariant: stripeCap?.badgeVariant || 'neutral',
      logo: (
        <Image
          src="/integrations/stripe.png"
          alt="Stripe"
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ),
    },
  ];

  const toolIntegrations: IntegrationCardProps[] = [
    {
      id: 'gcalendar',
      name: 'Google Calendar',
      badge: gcalendarCap?.statusLabel || 'Próximamente',
      badgeVariant: gcalendarCap?.badgeVariant || 'purple',
      logo: (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center border border-[#e5e7eb] text-[#4285F4]">
          <Calendar className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Cloud API',
      badge: whatsappCap?.statusLabel || 'Próximamente',
      badgeVariant: whatsappCap?.badgeVariant || 'purple',
      logo: (
        <div className="w-full h-full bg-[#25D366] flex items-center justify-center text-white">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Payments Section (Spanish label, 2 columns on md+) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            Pagos
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Pasarelas de cobro con tarjeta y billeteras digitales para confirmar reservas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {paymentIntegrations.map((item) => (
            <IntegrationCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      {/* Tools & Automations Section (2 columns on md+) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            Herramientas y Automatizaciones
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Sincronización con calendarios de conductores, guías y mensajería instantánea.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {toolIntegrations.map((item) => (
            <IntegrationCard key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
