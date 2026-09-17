'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  Compass,
  Car,
  Tag,
  Send,
  Image as ImageIcon,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { recordMarketingCampaignEmailAction } from '@/app/actions/marketing';

interface BookingItem {
  id: string;
  code: string | null;
  title: string;
  type: 'TOUR' | 'TRANSFER';
  date: string;
  pax: number;
  totalPrice: number;
  status: string;
  pickupHotel: string | null;
  marketingCode: string | null;
  source: string;
  createdAt: string;
}

interface CampaignLogItem {
  id: string;
  campaignCode: string;
  subject: string;
  message: string;
  flyerUrl: string | null;
  whatsappUrl: string | null;
  createdAt: string;
}

interface ContactData {
  email: string;
  fullName: string;
  phone: string | null;
  totalSpent: number;
  reservationsCount: number;
  hasAttributedBooking: boolean;
  attributedCodes: string[];
  reservations: BookingItem[];
  campaignsSent: CampaignLogItem[];
}

interface HistorialDetailClientProps {
  contact: ContactData;
  availableCoupons?: { id: string; code: string; discountType: string; discountValue: number; description: string | null }[];
}

const PRESET_FLYERS = [
  {
    id: 'flyer-machupicchu',
    name: 'Machu Picchu Full Day',
    url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&auto=format&fit=crop&q=80',
    discount: '15% OFF',
    tag: 'Clásico Imperdible',
  },
  {
    id: 'flyer-vinicunca',
    name: 'Montaña de 7 Colores',
    url: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=800&auto=format&fit=crop&q=80',
    discount: '20% OFF',
    tag: 'Aventura & Trekking',
  },
  {
    id: 'flyer-humantay',
    name: 'Laguna Humantay Turquesa',
    url: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&auto=format&fit=crop&q=80',
    discount: '10% OFF',
    tag: 'Naturaleza Pura',
  },
  {
    id: 'flyer-valle-sagrado',
    name: 'Valle Sagrado VIP',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
    discount: '15% OFF',
    tag: 'Cultura Inca',
  },
];

export function HistorialDetailClient({ contact, availableCoupons = [] }: HistorialDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'RESERVAS' | 'CAMPAÑAS' | 'ENVIAR'>('RESERVAS');
  const [campaignsList, setCampaignsList] = useState<CampaignLogItem[]>(contact.campaignsSent);

  // Estados de Redactor
  const [composeSubject, setComposeSubject] = useState(`¡Beneficio exclusivo para ti, ${contact.fullName.split(' ')[0]}!`);
  const [composeMessage, setComposeMessage] = useState(
    `Hola ${contact.fullName},\n\nTenemos una oferta especial pensada especialmente en tu próxima aventura en Cusco. Usa tu código exclusivo y contáctanos por WhatsApp para asegurar tus cupos con descuento.`
  );
  const [composeFlyerUrl, setComposeFlyerUrl] = useState(PRESET_FLYERS[0]?.url || '');
  const [composeMarketingCode, setComposeMarketingCode] = useState('MK1');
  const [isPending, startTransition] = useTransition();
  const [composeSuccess, setComposeSuccess] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const cleanPhone = contact.phone ? contact.phone.replace(/[^0-9]/g, '') : '';
  const directWhatsAppLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  const computedWhatsAppUrl = `https://wa.me/51984000000?text=${encodeURIComponent(
    `Hola, me interesa la promoción del flyer de ${composeMarketingCode.toUpperCase()}. Mi correo es ${contact.email}.`
  )}`;

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeMessage.trim()) {
      setComposeError('El asunto y mensaje no pueden estar vacíos.');
      return;
    }

    setComposeError(null);
    startTransition(async () => {
      const res = await recordMarketingCampaignEmailAction({
        customerEmail: contact.email,
        campaignCode: composeMarketingCode.toUpperCase(),
        subject: composeSubject,
        message: composeMessage,
        flyerUrl: composeFlyerUrl,
        whatsappUrl: computedWhatsAppUrl,
      });

      if (res.success && res.log) {
        setComposeSuccess(true);
        setCampaignsList((prev) => [
          {
            id: res.log.id,
            campaignCode: res.log.campaignCode,
            subject: res.log.subject,
            message: res.log.message,
            flyerUrl: res.log.flyerUrl || null,
            whatsappUrl: res.log.whatsappUrl || null,
            createdAt: 'Hace un momento',
          },
          ...prev,
        ]);
        setTimeout(() => setComposeSuccess(false), 4000);
      } else {
        setComposeError(res.error || 'Error al registrar campaña.');
      }
    });
  };

  return (
    <div className="space-y-5 font-sans select-none w-full min-w-0">
      
      {/* 1. Header Polaris con navegación de regreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/marketing"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Email Marketing</span>
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-medium text-slate-400 truncate">Historial de Cliente</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#008060]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate">
                {contact.fullName}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                {contact.email}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones directas */}
        <div className="flex items-center gap-2 shrink-0">
          {directWhatsAppLink && (
            <a
              href={directWhatsAppLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              title="Abrir conversación WhatsApp con el cliente"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Cliente</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('ENVIAR')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Redactar Flyer</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjeta de Métricas del Cliente */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Gasto Total (LTV)
          </span>
          <span className="text-xl md:text-2xl font-bold text-slate-900 mt-1 block">
            ${contact.totalSpent.toFixed(2)} USD
          </span>
          <span className="text-[11px] text-slate-400">Total en reservas</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Reservas Totales
          </span>
          <span className="text-xl md:text-2xl font-bold text-slate-900 mt-1 block">
            {contact.reservationsCount}
          </span>
          <span className="text-[11px] text-slate-400">
            {contact.reservationsCount > 1 ? 'Cliente Recurrente' : 'Primer Viaje'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            WhatsApp Registrado
          </span>
          <span className="text-sm md:text-base font-bold text-slate-900 mt-1.5 block truncate">
            {contact.phone || 'No registrado'}
          </span>
          <span className="text-[11px] text-slate-400">Canal de contacto directo</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Atribución Marketing
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {contact.attributedCodes.length > 0 ? (
              contact.attributedCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  <span>{code}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Sin código atribuido</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Campañas activadas</span>
        </div>
      </div>

      {/* 3. Selector de Pestañas Internas */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('RESERVAS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'RESERVAS'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Historial de Reservas ({contact.reservations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CAMPAÑAS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'CAMPAÑAS'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Campañas Enviadas ({campaignsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ENVIAR')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'ENVIAR'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span>Redactar Flyer / Campaña</span>
        </button>
      </div>

      {/* 4. Contenido de Pestaña: RESERVAS */}
      {activeTab === 'RESERVAS' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Todas las Reservas Efectuadas
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {contact.reservations.length} {contact.reservations.length === 1 ? 'servicio' : 'servicios'}
            </span>
          </div>

          {contact.reservations.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No hay reservas registradas con este correo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[28%]" />
                  <col className="w-[12%]" />
                  <col className="w-[6%]" />
                  <col className="w-[11%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Servicio Reservado</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Fecha Viaje</th>
                    <th className="px-4 py-3 text-center">PAX</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Origen</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {contact.reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-left">
                        {r.code ? (
                          <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 inline-block truncate max-w-[125px]">
                            {r.code}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="font-bold text-slate-900 uppercase line-clamp-1 text-xs" title={r.title}>
                          {r.title}
                        </div>
                        {r.marketingCode && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>MK: {r.marketingCode}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap text-xs font-semibold">
                        {r.date}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {r.pax}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        ${r.totalPrice.toFixed(2)} USD
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.type === 'TOUR' ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Compass size={12} className="shrink-0 text-teal-600" />
                            <span>Tour</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <Car size={12} className="shrink-0 text-sky-600" />
                            <span>Traslado</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {r.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.status === 'PAID' && (
                          <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> <span>Pagado</span>
                          </span>
                        )}
                        {r.status === 'PENDING' && (
                          <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> <span>Pendiente</span>
                          </span>
                        )}
                        {r.status === 'CANCELLED' && (
                          <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={12} /> <span>Cancelado</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link
                          href={`/reservas/${r.id}`}
                          target="_blank"
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          title="Ver detalle de reserva en nueva pestaña"
                        >
                          <span>Ver</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Contenido de Pestaña: CAMPAÑAS ENVIADAS */}
      {activeTab === 'CAMPAÑAS' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Historial de Flyers y Campañas Enviadas
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {campaignsList.length} registradas
            </span>
          </div>

          {campaignsList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Aún no se han enviado campañas de flyer a este cliente.</p>
              <button
                type="button"
                onClick={() => setActiveTab('ENVIAR')}
                className="mt-3 px-3 py-1.5 bg-[#008060] text-white rounded-lg text-xs font-semibold hover:bg-[#006e52] transition-colors cursor-pointer"
              >
                Redactar Primera Campaña
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {campaignsList.map((camp) => (
                <div key={camp.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start gap-4">
                  {camp.flyerUrl && (
                    <a
                      href={camp.flyerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative group shadow-2xs"
                    >
                      <img src={camp.flyerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ExternalLink size={14} />
                      </div>
                    </a>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        <span>Código: {camp.campaignCode}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {camp.createdAt}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">
                      {camp.subject}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {camp.message}
                    </p>

                    {camp.whatsappUrl && (
                      <div className="mt-2">
                        <a
                          href={camp.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <MessageSquare size={11} />
                          <span>Enlace de WhatsApp generado</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Contenido de Pestaña: REDACTAR FLYER */}
      {activeTab === 'ENVIAR' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
          <div className="border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Redactar Correo con Flyer y Atribución WhatsApp
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona un flyer temático y asigna el código de campaña para atribuir reservas cuando el cliente responda.
            </p>
          </div>

          {composeSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Campaña registrada y enviada con éxito. El código está activo para atribución de reservas.</span>
            </div>
          )}

          {composeError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{composeError}</span>
            </div>
          )}

          <form onSubmit={handleSendCampaign} className="space-y-4">
            {/* 1. Selector de Flyer */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                1. Selecciona el Flyer de Promoción
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_FLYERS.map((flyer) => {
                  const isSelected = composeFlyerUrl === flyer.url;
                  return (
                    <button
                      type="button"
                      key={flyer.id}
                      onClick={() => setComposeFlyerUrl(flyer.url)}
                      className={`relative rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#008060] ring-2 ring-[#008060]/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-28 w-full bg-slate-100 relative">
                        <img src={flyer.url} alt={flyer.name} className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold backdrop-blur-xs">
                          {flyer.discount}
                        </span>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="font-bold text-slate-900 text-xs truncate">{flyer.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{flyer.tag}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Código de Atribución */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. Código de Atribución MK
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={composeMarketingCode}
                    onChange={(e) => setComposeMarketingCode(e.target.value.toUpperCase())}
                    placeholder="Ej: MK1, PROMO20"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  {availableCoupons.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setComposeMarketingCode(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="">Cupones activos...</option>
                      {availableCoupons.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.code} ({c.discountValue}{c.discountType === 'PERCENTAGE' ? '%' : '$'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Este código se incluye en el enlace de WhatsApp para trackear compras.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            {/* 3. Mensaje */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mensaje Personalizado
              </label>
              <textarea
                rows={4}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
                required
              />
            </div>

            {/* 4. Vista previa de Botón WhatsApp */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Botón de Acción que verá el cliente:
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Reservar con Beneficio [{composeMarketingCode.toUpperCase()}]
                  </span>
                </div>
              </div>

              <a
                href={computedWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                <span>Probar Enlace WhatsApp</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </a>
            </div>

            {/* Botón de Envío */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <span>Registrando campaña...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar y Enviar Flyer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
