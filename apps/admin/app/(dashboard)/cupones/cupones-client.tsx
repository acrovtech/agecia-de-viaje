'use client';

import { useState, useMemo, useTransition } from 'react';
import { 
  Tags, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  Sparkles, 
  ShoppingBag, 
  TrendingUp,
  Target,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CouponItem, DiscountType, MarketingChannel } from '@repo/db';
import { 
  createCouponAction, 
  updateCouponAction, 
  toggleCouponStatusAction, 
  deleteCouponAction 
} from '@/app/actions/coupon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface CuponesClientProps {
  initialCoupons: CouponItem[];
}

const CHANNEL_CONFIG: Record<
  MarketingChannel,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  META_ADS: {
    label: 'Meta Ads (FB/IG)',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '📱',
  },
  TIKTOK_ADS: {
    label: 'TikTok Ads',
    bg: 'bg-zinc-900',
    text: 'text-cyan-300',
    border: 'border-zinc-800',
    icon: '🎵',
  },
  GOOGLE_ADS: {
    label: 'Google Ads',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: '🔍',
  },
  EMAIL_MARKETING: {
    label: 'Email Marketing',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: '✉️',
  },
  ORGANIC_VIDEO: {
    label: 'Video Orgánico',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: '🎬',
  },
};

export function CuponesClient({ initialCoupons }: CuponesClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | MarketingChannel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formChannel, setFormChannel] = useState<MarketingChannel>('META_ADS');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMinSpend, setFormMinSpend] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de Confirmación para Eliminar
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; coupon: CouponItem | null }>({
    isOpen: false,
    coupon: null,
  });

  // Métricas Analíticas y de Inteligencia de Campañas
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);
    const totalRevenue = coupons.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalBudget = coupons.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
    const averageRoas = totalBudget > 0 ? (totalRevenue / totalBudget).toFixed(2) : null;

    // Identificar Campaña Ganadora (Mayor facturación)
    const sortedByRevenue = [...coupons].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    const winner = sortedByRevenue[0]?.totalRevenue && sortedByRevenue[0].totalRevenue > 0 ? sortedByRevenue[0] : null;

    // Identificar Canal Líder en facturación
    const channelRevenueMap: Record<string, number> = {};
    coupons.forEach(c => {
      const ch = c.channel || 'META_ADS';
      channelRevenueMap[ch] = (channelRevenueMap[ch] || 0) + (c.totalRevenue || 0);
    });

    let topChannel: { channel: MarketingChannel; revenue: number } | null = null;
    Object.entries(channelRevenueMap).forEach(([ch, rev]) => {
      if (!topChannel || rev > topChannel.revenue) {
        if (rev > 0) {
          topChannel = { channel: ch as MarketingChannel, revenue: rev };
        }
      }
    });

    return { 
      total, 
      active, 
      totalUses, 
      totalRevenue, 
      totalBudget, 
      averageRoas, 
      winner, 
      topChannel 
    };
  }, [coupons]);

  // Filtrado de la tabla
  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return coupons.filter((c) => {
      const matchesSearch = 
        !query || 
        c.code.toLowerCase().includes(query) || 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filtro de canal
      if (channelFilter !== 'ALL' && (c.channel || 'META_ADS') !== channelFilter) {
        return false;
      }

      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;

      if (statusFilter === 'ACTIVE') return c.isActive && !isExpired;
      if (statusFilter === 'INACTIVE') return !c.isActive;
      if (statusFilter === 'EXPIRED') return isExpired;

      return true;
    });
  }, [coupons, searchQuery, channelFilter, statusFilter]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormName('');
    setFormCode('');
    setFormChannel('META_ADS');
    setFormStartDate('');
    setFormEndDate('');
    setFormBudget('');
    setFormDescription('');
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue('');
    setFormMinSpend('0');
    setFormMaxDiscount('');
    setFormExpiresAt('');
    setFormUsageLimit('');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormName(coupon.name || '');
    setFormCode(coupon.code);
    setFormChannel(coupon.channel || 'META_ADS');
    setFormStartDate(coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] || '' : '');
    setFormEndDate(coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] || '' : '');
    setFormBudget(coupon.budget ? coupon.budget.toString() : '');
    setFormDescription(coupon.description || '');
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue.toString());
    setFormMinSpend(coupon.minSpend ? coupon.minSpend.toString() : '0');
    setFormMaxDiscount(coupon.maxDiscount ? coupon.maxDiscount.toString() : '');
    setFormExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] || '' : '');
    setFormUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : '');
    setFormIsActive(coupon.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (coupon: CouponItem) => {
    startTransition(async () => {
      const res = await toggleCouponStatusAction(coupon.id);
      if (res.success && typeof res.isActive === 'boolean') {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: res.isActive! } : c));
        setFeedback({
          type: 'success',
          message: `Campaña [${coupon.code}] ${res.isActive ? 'activada' : 'pausada'} correctamente.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al cambiar estado de la campaña.',
        });
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = parseFloat(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('El valor del descuento debe ser un número mayor a 0.');
      return;
    }

    if (formDiscountType === 'PERCENTAGE' && val > 100) {
      setFormError('El porcentaje de descuento no puede exceder el 100%.');
      return;
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim() || undefined,
      channel: formChannel,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : undefined,
      budget: formBudget ? parseFloat(formBudget) : 0,
      description: formDescription.trim() || undefined,
      discountType: formDiscountType,
      discountValue: val,
      minSpend: formMinSpend ? parseFloat(formMinSpend) : 0,
      maxDiscount: formMaxDiscount ? parseFloat(formMaxDiscount) : undefined,
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
      usageLimit: formUsageLimit ? parseInt(formUsageLimit) : undefined,
      isActive: formIsActive,
    };

    startTransition(async () => {
      if (editingCoupon) {
        const res = await updateCouponAction({
          id: editingCoupon.id,
          ...payload,
        });
        if (res.success && res.coupon) {
          setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? {
            ...c,
            ...res.coupon,
            name: payload.name || null,
            channel: payload.channel,
            startDate: payload.startDate || null,
            endDate: payload.endDate || null,
            budget: payload.budget,
            createdAt: c.createdAt,
            updatedAt: new Date().toISOString(),
          } : c));
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: `Campaña [${payload.code}] actualizada exitosamente.` });
        } else {
          setFormError(res.error || 'Error al actualizar campaña.');
        }
      } else {
        const res = await createCouponAction(payload);
        if (res.success && res.coupon) {
          const created: CouponItem = {
            id: res.coupon.id,
            code: res.coupon.code,
            name: res.coupon.name || null,
            channel: res.coupon.channel || 'META_ADS',
            description: res.coupon.description,
            discountType: res.coupon.discountType,
            discountValue: res.coupon.discountValue,
            minSpend: res.coupon.minSpend,
            maxDiscount: res.coupon.maxDiscount,
            startDate: res.coupon.startDate ? res.coupon.startDate.toISOString() : null,
            endDate: res.coupon.endDate ? res.coupon.endDate.toISOString() : null,
            budget: res.coupon.budget || 0,
            expiresAt: res.coupon.expiresAt ? res.coupon.expiresAt.toISOString() : null,
            usageLimit: res.coupon.usageLimit,
            timesUsed: res.coupon.timesUsed || 0,
            totalRevenue: 0,
            roas: null,
            isActive: res.coupon.isActive,
            createdBy: res.coupon.createdBy,
            createdAt: res.coupon.createdAt.toISOString(),
            updatedAt: res.coupon.updatedAt.toISOString(),
          };
          setCoupons(prev => [created, ...prev]);
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: `Campaña [${payload.code}] creada exitosamente.` });
        } else {
          setFormError(res.error || 'Error al crear campaña.');
        }
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.coupon) return;
    const couponToDelete = deleteModal.coupon;

    startTransition(async () => {
      const res = await deleteCouponAction(couponToDelete.id);
      if (res.success) {
        if (res.message) {
          setCoupons(prev => prev.map(c => c.id === couponToDelete.id ? { ...c, isActive: false } : c));
          setFeedback({ type: 'success', message: res.message });
        } else {
          setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
          setFeedback({ type: 'success', message: `Campaña [${couponToDelete.code}] eliminada permanentemente.` });
        }
      } else {
        setFeedback({ type: 'error', message: res.error || 'Error al eliminar campaña.' });
      }
      setDeleteModal({ isOpen: false, coupon: null });
    });
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título, Contexto y Botón Principal Polaris */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#008060] shrink-0" />
            <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">
              Inteligencia de Campañas & Cupones
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Atribución multicanal de pauta (Meta, TikTok, Google), temporadas publicitarias e ingresos por conversión.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* 2. Feedback Alertas */}
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
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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

      {/* 3. Tarjetas KPI de Inteligencia Comercial (Polaris Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Ingresos Totales Atribuidos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ventas Atribuidas
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Dinero Real
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-700">USD</span>
          </div>
          <p className="text-xs text-slate-500 font-normal flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Facturación de reservas pagadas</span>
          </p>
        </div>

        {/* KPI 2: Campaña Ganadora */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Campaña Ganadora
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              <span>Top 1</span>
            </span>
          </div>
          <div className="mt-2.5 mb-0.5">
            {metrics.winner ? (
              <div>
                <div className="text-sm font-bold text-[#2f2f2f] truncate">
                  {metrics.winner.name || metrics.winner.code}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    {metrics.winner.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    +${metrics.winner.totalRevenue?.toLocaleString('en-US')} USD
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-slate-400 font-medium">Sin ventas registradas</span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Mayor retorno de inversión comercial
          </p>
        </div>

        {/* KPI 3: Canal Líder */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Canal Líder
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Volumen
            </span>
          </div>
          <div className="mt-2.5 mb-0.5">
            {metrics.topChannel ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{CHANNEL_CONFIG[metrics.topChannel.channel]?.icon}</span>
                  <span className="text-base font-bold text-[#2f2f2f]">
                    {CHANNEL_CONFIG[metrics.topChannel.channel]?.label}
                  </span>
                </div>
                <span className="text-xs text-blue-700 font-semibold block mt-0.5">
                  ${metrics.topChannel.revenue.toLocaleString('en-US')} USD generados
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm font-bold text-[#2f2f2f]">
                <span>📱 Meta Ads</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Canal publicitario más efectivo
          </p>
        </div>

        {/* KPI 4: Conversiones y ROAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conversiones / ROAS
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Eficacia
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.totalUses}
            </span>
            <span className="text-xs font-bold text-slate-500">reservas</span>
            {metrics.averageRoas && (
              <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {metrics.averageRoas}x ROAS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal">
            {metrics.active} de {metrics.total} campañas en curso
          </p>
        </div>

      </div>

      {/* 4. Barra de Filtros Rápidos por Canal */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setChannelFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
            channelFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos los Canales ({coupons.length})
        </button>

        {(Object.keys(CHANNEL_CONFIG) as MarketingChannel[]).map((ch) => {
          const cfg = CHANNEL_CONFIG[ch];
          const isSelected = channelFilter === ch;
          const count = coupons.filter(c => (c.channel || 'META_ADS') === ch).length;

          return (
            <button
              key={ch}
              type="button"
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
                isSelected
                  ? `${cfg.bg} ${cfg.text} border-slate-400 ring-1 ring-slate-400 font-bold`
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 5. Barra de Búsqueda y Filtros de Estado */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por campaña (ej: Día del Padre), cupón (ej: FDAY20) o canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[180px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {statusFilter === 'ALL' && 'Todos los estados'}
                    {statusFilter === 'ACTIVE' && 'Solo activas'}
                    {statusFilter === 'INACTIVE' && 'Solo pausadas'}
                    {statusFilter === 'EXPIRED' && 'Solo expiradas'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50">
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Todos los estados ({coupons.length})
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo activas ({metrics.active})
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo pausadas
                </SelectItem>
                <SelectItem value="EXPIRED" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo expiradas
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'ALL' || channelFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setChannelFilter('ALL');
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

      {/* 6. Tabla de Campañas con Atribución y Métricas Financieras */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <Target className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No se encontraron campañas con los filtros aplicados.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear primera campaña</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Campaña & Canal</th>
                  <th className="px-4 py-3 text-left">Temporada / Vigencia</th>
                  <th className="px-4 py-3 text-left">Beneficio</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Reservas</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Facturación & ROAS</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
                  const channel = coupon.channel || 'META_ADS';
                  const channelMeta = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.META_ADS;

                  // Estado de la temporada según fechas
                  let seasonStatus: { text: string; color: string } | null = null;
                  if (coupon.startDate && coupon.endDate) {
                    const now = new Date();
                    const start = new Date(coupon.startDate);
                    const end = new Date(coupon.endDate);
                    if (now >= start && now <= end) {
                      seasonStatus = { text: 'En curso', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
                    } else if (now > end) {
                      seasonStatus = { text: 'Finalizada', color: 'text-slate-500 bg-slate-100 border-slate-200' };
                    } else {
                      seasonStatus = { text: 'Próxima', color: 'text-blue-700 bg-blue-50 border-blue-200' };
                    }
                  }

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* 1. Campaña, Código y Canal */}
                      <td className="px-4 py-3 text-left">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-xs truncate max-w-[180px]" title={coupon.name || coupon.code}>
                              {coupon.name || 'Campaña sin nombre'}
                            </span>
                            
                            {/* Canal Badge */}
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold border ${channelMeta.bg} ${channelMeta.text} ${channelMeta.border}`}>
                              <span>{channelMeta.icon}</span>
                              <span>{channelMeta.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200 tracking-wider">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.code)}
                              title="Copiar cupón"
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 2. Temporada / Rango de Fechas */}
                      <td className="px-4 py-3 text-left">
                        <div className="space-y-1">
                          {coupon.startDate && coupon.endDate ? (
                            <div className="text-[11px] text-slate-700 font-medium">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {new Date(coupon.startDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                  {' - '}
                                  {new Date(coupon.endDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              {seasonStatus && (
                                <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${seasonStatus.color}`}>
                                  {seasonStatus.text}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Permanente</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Beneficio / Descuento */}
                      <td className="px-4 py-3 text-left">
                        <div className="space-y-0.5">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Percent className="w-3 h-3" />
                              <span>{coupon.discountValue}% OFF</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <DollarSign className="w-3 h-3" />
                              <span>${coupon.discountValue.toFixed(2)} USD</span>
                            </span>
                          )}
                          {coupon.minSpend && coupon.minSpend > 0 ? (
                            <div className="text-[10px] text-slate-400 font-normal">
                              Mín. ${coupon.minSpend}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* 4. Reservas / Cupos */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 font-bold text-xs shadow-2xs">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                            <span>{coupon.timesUsed}</span>
                            {coupon.usageLimit && (
                              <span className="text-[10px] text-amber-700 font-normal">/ {coupon.usageLimit}</span>
                            )}
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-amber-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, (coupon.timesUsed / coupon.usageLimit) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Facturación Real & ROAS */}
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block">
                            ${(coupon.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {coupon.budget && coupon.budget > 0 ? (
                              <span className="text-[10px] text-slate-500 font-normal">
                                Inv: ${coupon.budget}
                              </span>
                            ) : null}
                            {coupon.roas ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {coupon.roas}x ROAS
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 6. Acciones (Toggle Estado, Editar, Eliminar) */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Toggle Activo / Pausado */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={isPending}
                            title={coupon.isActive ? 'Campaña activa. Clic para pausar' : 'Campaña pausada. Clic para activar'}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors shadow-2xs cursor-pointer ${
                              coupon.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {coupon.isActive ? 'Activa' : 'Pausada'}
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            disabled={isPending}
                            title="Editar campaña"
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, coupon })}
                            disabled={isPending}
                            title="Eliminar campaña"
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN DE CAMPAÑA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[580px] bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="text-left border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#008060]" />
              <span>{editingCoupon ? `Editar Campaña: ${editingCoupon.code}` : 'Nueva Campaña Publicitaria'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vincula pautas de Meta, TikTok, Google Ads o Email con cupones únicos para medir ingresos y ROAS.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 mt-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3">
            
            {/* Nombre de la Campaña y Código de Cupón */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nombre de Campaña
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Día del Padre 2026, Inti Raymi VIP"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs font-semibold text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Código de Cupón Único *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="EJ: FDAY20, INTI26"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Canal Publicitario y Presupuesto Invertido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Canal de Marketing *</label>
                <Select value={formChannel} onValueChange={(val: any) => setFormChannel(val)}>
                  <SelectTrigger className="w-full h-9 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                    <span>{CHANNEL_CONFIG[formChannel]?.label || formChannel}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50">
                    <SelectItem value="META_ADS" className="text-xs font-medium cursor-pointer py-1.5 px-2">
                      📱 Meta Ads (Facebook / Instagram)
                    </SelectItem>
                    <SelectItem value="TIKTOK_ADS" className="text-xs font-medium cursor-pointer py-1.5 px-2">
                      🎵 TikTok Ads
                    </SelectItem>
                    <SelectItem value="GOOGLE_ADS" className="text-xs font-medium cursor-pointer py-1.5 px-2">
                      🔍 Google Ads (Search / Display)
                    </SelectItem>
                    <SelectItem value="EMAIL_MARKETING" className="text-xs font-medium cursor-pointer py-1.5 px-2">
                      ✉️ Email Marketing (Resend API)
                    </SelectItem>
                    <SelectItem value="ORGANIC_VIDEO" className="text-xs font-medium cursor-pointer py-1.5 px-2">
                      🎬 Video Orgánico (Reels / TikTok Viral)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Presupuesto Invertido (USD $)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="0.00 (Para cálculo de ROAS)"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Fechas de Campaña Publicitaria (Inicio y Fin) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Inicio del Anuncio</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Fin del Anuncio</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Tipo de Descuento (Toggle Porcentaje vs Monto Fijo) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de Beneficio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormDiscountType('PERCENTAGE')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                    formDiscountType === 'PERCENTAGE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Porcentaje (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormDiscountType('FIXED')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                    formDiscountType === 'FIXED'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monto Fijo (USD $)</span>
                </button>
              </div>
            </div>

            {/* Valor del Descuento y Gasto Mínimo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {formDiscountType === 'PERCENTAGE' ? 'Porcentaje (%) *' : 'Monto Fijo (USD $) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={formDiscountType === 'PERCENTAGE' ? 100 : undefined}
                  required
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  placeholder={formDiscountType === 'PERCENTAGE' ? '20' : '50.00'}
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs font-bold text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Compra Mínima (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formMinSpend}
                  onChange={(e) => setFormMinSpend(e.target.value)}
                  placeholder="0 (Sin mínimo)"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Cupo / Límite de Reservas y Fecha Límite de Canje */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Cupo Máximo de Reservas</label>
                <input
                  type="number"
                  min="1"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="Ej: 100 (Ilimitado si vacío)"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Límite para Canjear Cupón</label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Descripción / Notas de Estrategia */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Estrategia / Nota Interna</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ej: Escalado de presupuesto para temporada alta de junio e Inti Raymi"
                className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Switch Estado Activo */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Estado de la Campaña</p>
                <p className="text-[11px] text-slate-500">
                  {formIsActive ? 'La campaña y el cupón estarán activos para reservas.' : 'Campaña pausada.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008060]"></div>
              </label>
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="h-9 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="h-9 px-4 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors border border-[#006e52] cursor-pointer inline-flex items-center gap-1.5"
              >
                {isPending && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingCoupon ? 'Guardar Cambios' : 'Crear Campaña'}</span>
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, coupon: null })}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar campaña ${deleteModal.coupon?.code}?`}
        description={
          (deleteModal.coupon?.timesUsed || 0) > 0
            ? `Esta campaña registra ${deleteModal.coupon?.timesUsed} conversiones cerradas. Se desactivará para proteger el historial contable de ventas.`
            : 'Esta acción eliminará la campaña definitivamente del sistema.'
        }
        confirmText="Eliminar Campaña"
        cancelText="Cancelar"
        isLoading={isPending}
        variant="danger"
      />

    </div>
  );
}
