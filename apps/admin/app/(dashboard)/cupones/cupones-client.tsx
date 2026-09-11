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
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  Sparkles, 
  ShoppingBag, 
  Clock,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { CouponItem, DiscountType } from '@repo/db';
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

export function CuponesClient({ initialCoupons }: CuponesClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados del Modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formCode, setFormCode] = useState('');
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

  // Métricas Comerciales Globales
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);
    return { total, active, totalUses };
  }, [coupons]);

  // Filtrado de la tabla
  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return coupons.filter((c) => {
      const matchesSearch = 
        !query || 
        c.code.toLowerCase().includes(query) || 
        (c.description && c.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;

      if (statusFilter === 'ACTIVE') return c.isActive && !isExpired;
      if (statusFilter === 'INACTIVE') return !c.isActive;
      if (statusFilter === 'EXPIRED') return isExpired;

      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
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
    setFormCode(coupon.code);
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
          message: `Cupón [${coupon.code}] ${res.isActive ? 'activado' : 'pausado'} correctamente.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al cambiar estado del cupón.',
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
            createdAt: c.createdAt,
            updatedAt: new Date().toISOString(),
          } : c));
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: `Cupón [${payload.code}] actualizado exitosamente.` });
        } else {
          setFormError(res.error || 'Error al actualizar cupón.');
        }
      } else {
        const res = await createCouponAction(payload);
        if (res.success && res.coupon) {
          const created: CouponItem = {
            id: res.coupon.id,
            code: res.coupon.code,
            description: res.coupon.description,
            discountType: res.coupon.discountType,
            discountValue: res.coupon.discountValue,
            minSpend: res.coupon.minSpend,
            maxDiscount: res.coupon.maxDiscount,
            expiresAt: res.coupon.expiresAt ? res.coupon.expiresAt.toISOString() : null,
            usageLimit: res.coupon.usageLimit,
            timesUsed: res.coupon.timesUsed || 0,
            isActive: res.coupon.isActive,
            createdBy: res.coupon.createdBy,
            createdAt: res.coupon.createdAt.toISOString(),
            updatedAt: res.coupon.updatedAt.toISOString(),
          };
          setCoupons(prev => [created, ...prev]);
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: `Cupón [${payload.code}] creado exitosamente.` });
        } else {
          setFormError(res.error || 'Error al crear cupón.');
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
          setFeedback({ type: 'success', message: `Cupón [${couponToDelete.code}] eliminado permanentemente.` });
        }
      } else {
        setFeedback({ type: 'error', message: res.error || 'Error al eliminar cupón.' });
      }
      setDeleteModal({ isOpen: false, coupon: null });
    });
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título y Botón Principal Polaris */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Tags className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">
            Módulo de Cupones Comerciales
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Cupón</span>
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

      {/* 3. Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* KPI 1: Cupones Activos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cupones Activos
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Vigentes
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.active}
            </span>
            <span className="text-xs text-slate-400">de {metrics.total} totales</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Estrategias de descuento operando
          </p>
        </div>

        {/* KPI 2: Usos Realizados (Métrica Clave) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Usos Realizados
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Conversiones
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              {metrics.totalUses}
            </span>
            <span className="text-xs font-bold text-amber-700">ventas con cupón</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Captados vía ecommerce y reservas manuales
          </p>
        </div>

        {/* KPI 3: Atribución Comercial */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Canal de Venta
            </span>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Atribución
            </span>
          </div>
          <div className="mt-2.5 mb-0.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight">
              100%
            </span>
            <span className="text-xs font-medium text-teal-700">Auditado MKT</span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Registrado en BD sin intervención manual
          </p>
        </div>

      </div>

      {/* 4. Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código de cupón (ej: CUMPLE10) o descripción..."
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
                    {statusFilter === 'ACTIVE' && 'Solo activos'}
                    {statusFilter === 'INACTIVE' && 'Solo pausados'}
                    {statusFilter === 'EXPIRED' && 'Solo expirados'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50">
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Todos los estados ({coupons.length})
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo activos ({metrics.active})
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo pausados
                </SelectItem>
                <SelectItem value="EXPIRED" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  Solo expirados
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
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

      {/* 5. Tabla de Cupones */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <Tags className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No se encontraron cupones con los filtros aplicados.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear primer cupón</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[24%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Código de Cupón</th>
                  <th className="px-4 py-3 text-left">Descuento</th>
                  <th className="px-4 py-3 text-left">Descripción / Estrategia</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Usos Realizados</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Expiración</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* 1. Código en Mayúsculas con Botón Copiar */}
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            title="Copiar código al portapapeles"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Beneficio / Descuento */}
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-1.5">
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
                        </div>
                        {coupon.minSpend && coupon.minSpend > 0 ? (
                          <div className="text-[10.5px] text-slate-400 pt-0.5 font-normal">
                            Min. gasto: ${coupon.minSpend}
                          </div>
                        ) : null}
                      </td>

                      {/* 3. Descripción */}
                      <td className="px-4 py-3 text-left">
                        <p className="text-xs text-slate-700 font-normal line-clamp-2">
                          {coupon.description || 'Sin descripción'}
                        </p>
                      </td>

                      {/* 4. Usos Realizados (Métrica Clave) */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 font-bold text-xs shadow-2xs">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          <span>{coupon.timesUsed}</span>
                          {coupon.usageLimit && (
                            <span className="text-[10px] text-amber-700 font-normal">/ {coupon.usageLimit} max</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Expiración */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {coupon.expiresAt ? (
                          <div className="space-y-0.5">
                            <span className={`text-[11px] font-medium ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                              {new Date(coupon.expiresAt).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {isExpired && (
                              <span className="block text-[9.5px] text-rose-500 uppercase font-bold">Expirado</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin caducidad</span>
                        )}
                      </td>

                      {/* 6. Acciones (Toggle Estado, Editar, Eliminar) */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Toggle Activo / Pausado */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={isPending}
                            title={coupon.isActive ? 'Cupón activo. Clic para pausar' : 'Cupón pausado. Clic para activar'}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors shadow-2xs cursor-pointer ${
                              coupon.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {coupon.isActive ? 'Activo' : 'Pausado'}
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            disabled={isPending}
                            title="Editar cupón"
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, coupon })}
                            disabled={isPending}
                            title="Eliminar cupón"
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

      {/* MODAL DE CREACIÓN / EDICIÓN DE CUPÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[530px] bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="text-left border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-[#008060]" />
              <span>{editingCoupon ? `Editar Cupón: ${editingCoupon.code}` : 'Crear Nuevo Cupón Comercial'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Define códigos en mayúsculas, descuentos porcentuales o fijos y límites de uso.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 mt-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3">
            
            {/* Código del Cupón en Mayúsculas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Código del Cupón (Forzado a Mayúsculas) *
              </label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="EJ: CUMPLE10, HUMANTAY20"
                className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 uppercase tracking-wider"
              />
              <span className="text-[10.5px] text-slate-400 block">
                Solo letras mayúsculas, números y guiones. Sin espacios.
              </span>
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
                  placeholder={formDiscountType === 'PERCENTAGE' ? '10' : '25.00'}
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

            {/* Fecha de Expiración y Límite de Usos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Fecha de Expiración</label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Límite Máximo de Usos</label>
                <input
                  type="number"
                  min="1"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Descripción / Campaña */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Descripción / Estrategia</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ej: Descuento exclusivo para venta cruzada o cumpleaños"
                className="w-full px-3 py-2 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Switch Estado Activo */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Estado del Cupón</p>
                <p className="text-[11px] text-slate-500">
                  {formIsActive ? 'El cupón podrá ser aplicado inmediatamente.' : 'Cupón pausado temporalmente.'}
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
                <span>{editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}</span>
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
        title={`¿Eliminar cupón ${deleteModal.coupon?.code}?`}
        description={
          (deleteModal.coupon?.timesUsed || 0) > 0
            ? `Este cupón registra ${deleteModal.coupon?.timesUsed} usos realizados. Se desactivará para proteger el historial contable de ventas.`
            : 'Esta acción eliminará el cupón definitivamente del catálogo.'
        }
        confirmText="Eliminar Cupón"
        cancelText="Cancelar"
        isLoading={isPending}
        variant="danger"
      />

    </div>
  );
}
