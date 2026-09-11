'use client';

import { useState, useMemo, useTransition } from 'react';
import { 
  Mail, 
  Search, 
  Users, 
  Phone, 
  Calendar, 
  DollarSign, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Eye, 
  Compass, 
  Car, 
  ExternalLink, 
  ArrowRight, 
  Image as ImageIcon, 
  ChevronRight, 
  CheckCheck, 
  AlertCircle,
  Tag
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { recordMarketingCampaignEmailAction } from '@/app/actions/marketing';

export interface CustomerBookingSummary {
  id: string;
  code: string | null;
  title: string;
  type: 'TOUR' | 'TRANSFER';
  date: string;
  pax: number;
  totalPrice: number;
  status: string;
  pickupHotel?: string | null;
  marketingCode?: string | null;
  source?: string | null;
  createdAt: string;
}

export interface CustomerCampaignLog {
  id: string;
  campaignCode: string;
  subject: string;
  message: string;
  flyerUrl?: string | null;
  whatsappUrl?: string | null;
  createdAt: string;
}

export interface MarketingContact {
  email: string;
  fullName: string;
  phone: string | null;
  reservationsCount: number;
  totalSpent: number;
  lastReservationDate: string;
  lastStatus: string;
  preferredService: string;
  hasAttributedBooking: boolean;
  attributedCodes: string[];
  campaignsSent: CustomerCampaignLog[];
  reservations: CustomerBookingSummary[];
}

interface MarketingClientProps {
  initialContacts: MarketingContact[];
  availableCoupons?: { id: string; code: string; discountType: string; discountValue: number; description?: string }[];
}

const PRESET_FLYERS = [
  {
    name: 'Machu Picchu Full Day',
    url: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp',
  },
  {
    name: 'Valle Sagrado VIP',
    url: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875486698-waqrapukara-banner.webp',
  },
  {
    name: 'Laguna Humantay',
    url: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875453808-laguna-humantay-banner.webp',
  },
  {
    name: 'Montaña de 7 Colores',
    url: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875465196-vinicunca-banner.webp',
  },
];

export function MarketingClient({ initialContacts, availableCoupons = [] }: MarketingClientProps) {
  const [contacts, setContacts] = useState<MarketingContact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal 1: Detalle del Cliente e Historial de Reservas
  const [selectedContact, setSelectedContact] = useState<MarketingContact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal 2: Redactar Correo con Flyer y Botón WhatsApp MK
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [composeRecipientEmail, setComposeRecipientEmail] = useState('');
  const [composeRecipientName, setComposeRecipientName] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeFlyerUrl, setComposeFlyerUrl] = useState(PRESET_FLYERS[0]?.url || '');
  const [composeMarketingCode, setComposeMarketingCode] = useState('MK1');
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState(false);

  // Estadísticas agregadas
  const metrics = useMemo(() => {
    const total = contacts.length;
    const withPhone = contacts.filter((c) => Boolean(c.phone && c.phone.trim().length > 4)).length;
    const recurrent = contacts.filter((c) => c.reservationsCount > 1).length;
    const attributedCount = contacts.filter((c) => c.hasAttributedBooking).length;
    const totalRevenue = contacts.reduce((sum, c) => sum + c.totalSpent, 0);

    return { total, withPhone, recurrent, attributedCount, totalRevenue };
  }, [contacts]);

  // Filtrado de contactos
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        c.email.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        c.attributedCodes.some((code) => code.toLowerCase().includes(query));

      let matchesFilter = true;
      if (filterType === 'PHONE') {
        matchesFilter = Boolean(c.phone && c.phone.trim().length > 4);
      } else if (filterType === 'RECURRENT') {
        matchesFilter = c.reservationsCount > 1;
      } else if (filterType === 'ATTRIBUTED') {
        matchesFilter = c.hasAttributedBooking;
      } else if (filterType === 'PAID') {
        matchesFilter = c.lastStatus === 'PAID';
      } else if (filterType === 'CROSS_SELL_HUMANTAY') {
        // Venta Cruzada: Pasajero que hizo Machu Picchu o Cusco, pero aún NO Humantay
        const hasMachuOrCusco = c.reservations.some(r => {
          const t = r.title.toLowerCase();
          return t.includes('machu') || t.includes('cusco') || t.includes('valle');
        });
        const hasHumantay = c.reservations.some(r => r.title.toLowerCase().includes('humantay'));
        matchesFilter = hasMachuOrCusco && !hasHumantay;
      } else if (filterType === 'CROSS_SELL_VINICUNCA') {
        // Venta Cruzada: Pasajero que hizo algún tour pero aún NO Montaña de 7 Colores
        const hasVinicunca = c.reservations.some(r => {
          const t = r.title.toLowerCase();
          return t.includes('vinicunca') || t.includes('colores');
        });
        matchesFilter = c.reservations.length > 0 && !hasVinicunca;
      } else if (filterType === 'ANNUAL_LOYALTY') {
        // Fidelización / Reenganche Anual: Clientes con gasto acumulado > $150 USD o recurrentes
        matchesFilter = c.totalSpent >= 150 || c.reservationsCount >= 2;
      }

      return matchesQuery && matchesFilter;
    });
  }, [contacts, searchQuery, filterType]);

  // Checkboxes de Selección
  const isAllSelected = filteredContacts.length > 0 && selectedEmails.length === filteredContacts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredContacts.map((c) => c.email));
    }
  };

  const toggleSelect = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Copiar correos al portapapeles
  const handleCopyEmails = () => {
    const listToCopy = selectedEmails.length > 0 ? selectedEmails : filteredContacts.map((c) => c.email);
    if (listToCopy.length === 0) return;

    navigator.clipboard.writeText(listToCopy.join(', '));
    setCopied(true);
    setFeedback({ type: 'success', message: `${listToCopy.length} correos copiados al portapapeles.` });
    setTimeout(() => setCopied(false), 2500);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const listToExport = selectedEmails.length > 0
      ? contacts.filter((c) => selectedEmails.includes(c.email))
      : filteredContacts;

    if (listToExport.length === 0) return;

    const headers = ['Nombre Completo', 'Correo Electrónico', 'Teléfono / WhatsApp', 'Total Reservas', 'Inversión Total (USD)', 'Última Reserva', 'Atribución MK'];
    const rows = listToExport.map((c) => [
      `"${c.fullName}"`,
      `"${c.email}"`,
      `"${c.phone || 'Sin número'}"`,
      c.reservationsCount,
      c.totalSpent.toFixed(2),
      `"${c.lastReservationDate}"`,
      `"${c.attributedCodes.join(', ') || 'Sin código'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos-marketing-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: 'success', message: `Exportados ${listToExport.length} contactos a archivo CSV.` });
  };

  // Abrir Modal de Detalle de Cliente
  const openDetailModal = (contact: MarketingContact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  // Abrir Modal de Redactar Correo
  const openComposeModal = (contact?: MarketingContact) => {
    if (contact) {
      setComposeRecipientEmail(contact.email);
      setComposeRecipientName(contact.fullName);
      setComposeSubject(`¡Beneficio Exclusivo en tu Próximo Viaje a Cusco, ${contact.fullName.split(' ')[0]}!`);
      setComposeMessage(
        `Hola ${contact.fullName.split(' ')[0]},\n\n` +
        `Notamos que anteriormente reservaste con nosotros y queremos premiar tu preferencia. ` +
        `Te presentamos nuestra promoción de temporada con un descuento especial en tours y traslados privados.\n\n` +
        `Haz clic en el botón de WhatsApp abajo usando tu código exclusivo para coordinar tu reserva de inmediato.`
      );
    } else {
      const recipientList = selectedEmails.length > 0 ? selectedEmails.join(', ') : 'Todos los contactos de la lista';
      setComposeRecipientEmail(recipientList);
      setComposeRecipientName('Estimado(a) Viajero(a)');
      setComposeSubject('¡Promoción Especial de Temporada en Cusco & Machu Picchu!');
      setComposeMessage(
        `Hola viajero,\n\n` +
        `Descubre la magia de los Andes peruanos con nuestras ofertas exclusivas en tours guiados y traslados ejecutivos.\n\n` +
        `Comunícate directamente a nuestro WhatsApp oficial con el código promocional para activar tu tarifa especial.`
      );
    }

    setComposeMarketingCode('MK1');
    setComposeFlyerUrl(PRESET_FLYERS[0]?.url || '');
    setComposeError(null);
    setComposeSuccess(false);
    setIsComposeModalOpen(true);
  };

  // Generar URL de WhatsApp con el código MK incrustado
  const computedWhatsAppUrl = useMemo(() => {
    const phoneClean = '51984555777'; // Teléfono oficial de reservas
    const textMsg = encodeURIComponent(
      `¡Hola! Recibí la promoción por correo electrónico con el código [${composeMarketingCode.toUpperCase()}]. ` +
      `Deseo solicitar información y reservar con este beneficio.`
    );
    return `https://wa.me/${phoneClean}?text=${textMsg}`;
  }, [composeMarketingCode]);

  // Enviar / Registrar Correo de Campaña
  const handleSendCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError(null);

    if (!composeRecipientEmail.trim()) {
      setComposeError('Debe especificar al menos un destinatario.');
      return;
    }
    if (!composeSubject.trim()) {
      setComposeError('El asunto del correo es requerido.');
      return;
    }
    if (!composeMessage.trim()) {
      setComposeError('El cuerpo del mensaje no puede estar vacío.');
      return;
    }
    if (!composeMarketingCode.trim()) {
      setComposeError('El código de atribución de Marketing es obligatorio (ej: MK1).');
      return;
    }

    startTransition(async () => {
      // Si es un solo correo o varios, registramos para el email principal
      const targetEmail = composeRecipientEmail.includes(',') 
        ? composeRecipientEmail.split(',')[0]!.trim()
        : composeRecipientEmail.trim();

      const res = await recordMarketingCampaignEmailAction({
        customerEmail: targetEmail,
        campaignCode: composeMarketingCode.trim().toUpperCase(),
        subject: composeSubject.trim(),
        message: composeMessage.trim(),
        flyerUrl: composeFlyerUrl.trim() || undefined,
        whatsappUrl: computedWhatsAppUrl,
      });

      if (res.success && res.log) {
        setComposeSuccess(true);
        // Actualizar contacto en estado local
        setContacts((prev) =>
          prev.map((c) => {
            if (c.email.toLowerCase() === targetEmail.toLowerCase()) {
              return {
                ...c,
                campaignsSent: [
                  {
                    id: res.log.id,
                    campaignCode: res.log.campaignCode,
                    subject: res.log.subject,
                    message: res.log.message,
                    flyerUrl: res.log.flyerUrl,
                    whatsappUrl: res.log.whatsappUrl,
                    createdAt: 'Hace un momento',
                  },
                  ...c.campaignsSent,
                ],
              };
            }
            return c;
          })
        );

        setTimeout(() => {
          setIsComposeModalOpen(false);
          setFeedback({
            type: 'success',
            message: `Campaña enviada y registrada con código de atribución [${composeMarketingCode.toUpperCase()}].`,
          });
        }, 1200);
      } else {
        setComposeError(res.error || 'Error al registrar la campaña.');
      }
    });
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título, Botones de Acción y Redactar Campaña */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">
            Email Marketing & Contactos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Copiar lista de correos separados por comas"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copiados' : 'Copiar Correos'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Descargar base de datos en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => openComposeModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Redactar Correo con Flyer</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TEMPORAL */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
              : 'bg-rose-50 text-rose-800 border border-rose-200/90'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Tarjetas KPI de Resumen Comercial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Base de Contactos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contactos
            </span>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              100% Leads
            </span>
          </div>
          <div className="mt-2.5 mb-0.5">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.total}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Clientes únicos con email registrado
          </p>
        </div>

        {/* KPI 2: Con Teléfono / WhatsApp */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              WhatsApp Activo
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Móvil
            </span>
          </div>
          <div className="mt-2.5 mb-0.5">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.withPhone}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Listos para campañas directas
          </p>
        </div>

        {/* KPI 3: Ventas Atribuidas a Marketing */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Atribución MK
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Captados
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.attributedCount}
            </span>
            <span className="text-xs font-bold text-amber-700">con código MK</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Ventas cerradas con código de campaña
          </p>
        </div>

        {/* KPI 4: Volumen Total de Cartera */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Volumen Cartera
            </span>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Ventas
            </span>
          </div>
          <div className="mt-2.5 mb-0.5">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Facturado acumulado por clientes
          </p>
        </div>

      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, teléfono o código MK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select value={filterType} onValueChange={(val) => setFilterType(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[240px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {filterType === 'ALL' && 'Todos los clientes'}
                    {filterType === 'CROSS_SELL_HUMANTAY' && '🎯 Venta Cruzada: Humantay'}
                    {filterType === 'CROSS_SELL_VINICUNCA' && '🌈 Venta Cruzada: 7 Colores'}
                    {filterType === 'ANNUAL_LOYALTY' && '👑 Fidelización (VIP / Antiguos)'}
                    {filterType === 'RECURRENT' && 'Clientes recurrentes (+1)'}
                    {filterType === 'PHONE' && 'Solo con WhatsApp'}
                    {filterType === 'PAID' && 'Con pagos confirmados'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[240px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50">
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Todos los clientes ({contacts.length})
                </SelectItem>
                <SelectItem value="CROSS_SELL_HUMANTAY" className="text-xs font-semibold text-emerald-800 cursor-pointer py-1.5 px-2 rounded-lg">
                  🎯 Venta Cruzada: Ofrecer Humantay
                </SelectItem>
                <SelectItem value="CROSS_SELL_VINICUNCA" className="text-xs font-semibold text-teal-800 cursor-pointer py-1.5 px-2 rounded-lg">
                  🌈 Venta Cruzada: Ofrecer 7 Colores
                </SelectItem>
                <SelectItem value="ANNUAL_LOYALTY" className="text-xs font-semibold text-amber-800 cursor-pointer py-1.5 px-2 rounded-lg">
                  👑 Fidelización (VIP / Reenganche)
                </SelectItem>
                <SelectItem value="RECURRENT" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Clientes recurrentes ({metrics.recurrent})
                </SelectItem>
                <SelectItem value="PHONE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo con WhatsApp ({metrics.withPhone})
                </SelectItem>
                <SelectItem value="PAID" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Con pagos confirmados
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterType !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                }}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabla de Contactos de Marketing */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <p className="font-semibold text-slate-600">No se encontraron contactos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Correo</th>
                  <th className="px-4 py-3 text-left">Número</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Cantidad de Reservas</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedEmails.includes(contact.email);
                  return (
                    <tr
                      key={contact.email}
                      className={`transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(contact.email)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* 1. Nombre */}
                      <td className="px-4 py-3 text-left">
                        <span className="font-semibold text-slate-900 truncate block">
                          {contact.fullName}
                        </span>
                      </td>

                      {/* 2. Correo */}
                      <td className="px-4 py-3 text-left">
                        <span className="text-xs text-slate-600 font-mono truncate block">
                          {contact.email}
                        </span>
                      </td>

                      {/* 3. Número */}
                      <td className="px-4 py-3 text-left">
                        {contact.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-700 text-xs truncate">
                              {contact.phone}
                            </span>
                            <a
                              href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 4. Cantidad de Reservas (Únicamente número) */}
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {contact.reservationsCount}
                      </td>

                      {/* 5. Total */}
                      <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        ${contact.totalSpent.toFixed(2)} USD
                      </td>

                      {/* 6. Historial */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetailModal(contact)}
                          className="px-3 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Ver historial completo y redactar correo"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Historial</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: DETALLE DE CLIENTE & HISTORIAL DE RESERVAS */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          {selectedContact && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#008060]" />
                      <span>Ficha de Cliente & Historial de Reservas</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Patrón de compra, reservas efectuadas y redactor de campañas personalizadas.
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedContact.hasAttributedBooking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Atribución Validada</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        openComposeModal(selectedContact);
                      }}
                      className="h-8 px-3 bg-[#008060] hover:bg-[#006e52] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Redactar Correo</span>
                    </button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Resumen del Cliente */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Nombre</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">{selectedContact.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Correo</span>
                    <span className="text-xs font-medium text-slate-700 truncate block font-mono">{selectedContact.email}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Gasto Total</span>
                    <span className="text-xs font-bold text-[#008060] block">${selectedContact.totalSpent.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">WhatsApp</span>
                    <span className="text-xs font-medium text-slate-800 block">{selectedContact.phone || 'Sin número'}</span>
                  </div>
                </div>

                {/* Patrón de Reserva Detectado */}
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-teal-950 block">Patrón de Viaje Detectado:</span>
                      <span className="text-[11px] text-teal-800">
                        {selectedContact.preferredService} ({selectedContact.reservationsCount} {selectedContact.reservationsCount === 1 ? 'reserva realizada' : 'reservas realizadas'})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openComposeModal(selectedContact);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-teal-100/60 border border-teal-300 text-teal-800 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3 text-teal-700" />
                    <span>Ofrecer según patrón</span>
                  </button>
                </div>

                {/* Comparativa de Atribución Marketing */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      <span>Comparación & Validación de Atribución Comercial</span>
                    </span>
                    {selectedContact.hasAttributedBooking ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Éxito de Retribución
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Seguimiento Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-900 leading-relaxed">
                    {selectedContact.hasAttributedBooking ? (
                      <>
                        🎯 <strong>¡Venta Atribuida con Éxito al Equipo de Marketing!</strong> El cliente recibió una campaña con código y el operador registró la reserva confirmada con el código <strong>[{selectedContact.attributedCodes.join(', ')}]</strong>.
                      </>
                    ) : selectedContact.campaignsSent.length > 0 ? (
                      <>
                        ⏳ Se envió el código <strong>[{selectedContact.campaignsSent[0]?.campaignCode}]</strong> por correo electrónico. Cuando el cliente concrete la compra por WhatsApp, el operador ingresará este código en su reserva manual.
                      </>
                    ) : (
                      <>
                        ℹ️ Este cliente aún no ha recibido un código de campaña por correo electrónico. Puedes enviarle una oferta con código <strong>MK1</strong> usando el botón de abajo.
                      </>
                    )}
                  </p>
                </div>

                {/* Historial Completo de Reservas */}
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-2">
                    Historial de Reservas Realizadas ({selectedContact.reservations.length})
                  </span>
                  {selectedContact.reservations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No registra reservas todavía.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 text-[10.5px] uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Servicio</th>
                            <th className="p-2.5 text-center">Fecha</th>
                            <th className="p-2.5 text-center">Pax</th>
                            <th className="p-2.5 text-center">Total</th>
                            <th className="p-2.5 text-center">Estado</th>
                            <th className="p-2.5 text-center">Código MK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {selectedContact.reservations.map((res) => (
                            <tr key={res.id} className="hover:bg-slate-50/60">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 truncate max-w-[200px]">{res.title}</div>
                                {res.code && <span className="text-[10px] text-slate-400 font-mono">#{res.code}</span>}
                              </td>
                              <td className="p-2.5 text-center text-slate-600 whitespace-nowrap">{res.date}</td>
                              <td className="p-2.5 text-center">{res.pax} pax</td>
                              <td className="p-2.5 text-center font-bold text-slate-900">${res.totalPrice.toFixed(2)}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  res.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {res.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                {res.marketingCode ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                    {res.marketingCode}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Historial de Campañas Enviadas */}
                {selectedContact.campaignsSent.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      Campañas de Email Enviadas ({selectedContact.campaignsSent.length})
                    </span>
                    <div className="space-y-2">
                      {selectedContact.campaignsSent.map((camp) => (
                        <div key={camp.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{camp.subject}</span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              Código WhatsApp: {camp.campaignCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{camp.message}</p>
                          <div className="flex items-center justify-between pt-1 text-[10.5px] text-slate-400">
                            <span>Enviado: {camp.createdAt}</span>
                            {camp.flyerUrl && (
                              <a href={camp.flyerUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-semibold">
                                <ImageIcon className="w-3 h-3" />
                                <span>Ver flyer adjunto</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openComposeModal(selectedContact);
                  }}
                  className="h-9 px-4 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Redactar Correo con Código MK</span>
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REDACTAR CORREO CON FLYER Y BOTÓN WHATSAPP MK */}
      <Dialog open={isComposeModalOpen} onOpenChange={setIsComposeModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#008060]" />
              <span>Redactor de Campaña con Flyer & Botón WhatsApp MK</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Diseña y registra ofertas personalizadas. Incluye flyer gráfico y botón directo a WhatsApp con código de atribución comercial.
            </DialogDescription>
          </DialogHeader>

          {composeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{composeError}</span>
            </div>
          )}

          {composeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Campaña enviada y código de atribución registrado exitosamente!</span>
            </div>
          )}

          <form onSubmit={handleSendCampaignSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Columna Izquierda: Formulario de Redacción */}
              <div className="lg:col-span-7 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Destinatario(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={composeRecipientEmail}
                    onChange={(e) => setComposeRecipientEmail(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Asunto del Correo *
                  </label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder="Ej: ¡Descuento Especial en tu Próximo Tour!"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mensaje / Cuerpo de la Oferta *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed resize-none"
                    placeholder="Redacta la oferta que motivará al cliente a reservar..."
                  />
                </div>

                {/* Selección / Subida de Flyer */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Flyer Gráfico Promocional
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {PRESET_FLYERS.map((f) => (
                      <button
                        type="button"
                        key={f.name}
                        onClick={() => setComposeFlyerUrl(f.url)}
                        className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-all flex items-center gap-2 cursor-pointer ${
                          composeFlyerUrl === f.url
                            ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder="O ingresa URL personalizada de imagen/flyer..."
                    value={composeFlyerUrl}
                    onChange={(e) => setComposeFlyerUrl(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Selector de Cupones Comerciales Activos */}
                {availableCoupons.length > 0 && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Vincular Cupón Comercial Activo</span>
                      </label>
                      <span className="text-[10.5px] text-purple-700 font-semibold">
                        {availableCoupons.length} disponibles
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          type="button"
                          onClick={() => {
                            setComposeMarketingCode(coupon.code);
                            if (!composeSubject || composeSubject.includes('Descuento') || composeSubject.includes('¡')) {
                              setComposeSubject(`¡Regalo Exclusivo! Usa tu cupón ${coupon.code} en tu próximo viaje`);
                            }
                            if (!composeMessage || composeMessage.length < 30) {
                              setComposeMessage(`¡Hola! Por ser cliente preferente, queremos obsequiarte un beneficio único: utiliza tu cupón ${coupon.code} y obtén ${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : ' USD'} de descuento en tu próxima experiencia.`);
                            }
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                            composeMarketingCode === coupon.code
                              ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                              : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200'
                          }`}
                        >
                          {coupon.code} ({coupon.discountValue}{coupon.discountType === 'PERCENTAGE' ? '%' : '$'})
                        </button>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-purple-800">
                      Al hacer clic en un cupón, se actualiza el código de campaña y el botón rastreable de WhatsApp.
                    </p>
                  </div>
                )}

                {/* Código de Atribución */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Código de Atribución WhatsApp (ej: MK1)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={composeMarketingCode}
                    onChange={(e) => setComposeMarketingCode(e.target.value.toUpperCase())}
                    className="w-full h-8 px-3 bg-white border border-amber-300 rounded-lg text-xs font-bold tracking-wider text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                    placeholder="MK1"
                  />
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Este código irá integrado en el enlace de WhatsApp del correo. Cuando el cliente toque el botón, enviará el código y el operador lo registrará en la reserva.
                  </p>
                </div>
              </div>

              {/* Columna Derecha: Vista Previa en Vivo del Correo */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Vista Previa del Correo</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {composeMarketingCode.toUpperCase() || 'MK1'}
                    </span>
                  </div>

                  {/* Mockup de Email */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {composeFlyerUrl && (
                      <div className="w-full h-32 relative bg-slate-900 overflow-hidden">
                        <img 
                          src={composeFlyerUrl} 
                          alt="Flyer promocional" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                          <span className="text-white text-[11px] font-bold tracking-wide">
                            AGENCIA DE VIAJES CUSCO
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {composeSubject || 'Asunto del Correo'}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                        {composeMessage || 'Tu mensaje promocional aparecerá aquí...'}
                      </p>

                      {/* Botón Verde WhatsApp */}
                      <div className="pt-2">
                        <a
                          href={computedWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all text-center"
                        >
                          <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                          <span>Reservar con Beneficio [{composeMarketingCode.toUpperCase() || 'MK1'}]</span>
                        </a>
                        <span className="text-[9.5px] text-slate-400 text-center block mt-1">
                          Enlace dinámico de WhatsApp con código de atribución
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Al hacer clic en enviar, se registrará el código para contrastarlo con futuras reservas.</span>
                </div>
              </div>

            </div>

            <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsComposeModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || composeSuccess}
                className="h-9 px-5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white rounded-xl text-xs font-bold shadow-2xs transition-all border border-[#006e52] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar y Enviar Campaña</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
