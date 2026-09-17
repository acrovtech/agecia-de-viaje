'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour, Transfer, VehicleType } from '@repo/db';
import Link from 'next/link';
import { 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Trash2, 
  Compass, 
  Car, 
  ArrowUpDown, 
  RotateCcw, 
  Filter, 
  Plus, 
  Sparkles, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { deleteReservationsAction, createManualReservationAction } from '@/app/actions/reservation';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export type ReservationWithRelations = Reservation & { 
  tour: Tour | null;
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
  marketingCode?: string | null;
  source?: string | null;
};

type SortOption = 'newest_created' | 'closest_travel' | 'furthest_travel';
type ServiceTypeFilter = 'ALL' | 'TOUR' | 'TRANSFER';

interface ReservasClientProps {
  initialReservas: ReservationWithRelations[];
  availableTours?: { id: string; title: string; sharedPrice: number }[];
  availableTransfers?: { id: string; title: string; sharedPrice: number }[];
  availableVehicles?: { id: string; name: string; code: string }[];
  availableCoupons?: { id: string; code: string; discountType: string; discountValue: number }[];
}

export function ReservasClient({ 
  initialReservas,
  availableTours = [],
  availableTransfers = [],
  availableVehicles = [],
  availableCoupons = []
}: ReservasClientProps) {
  const [reservas, setReservas] = useState<ReservationWithRelations[]>(initialReservas);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<ServiceTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest_created');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para Modal de Nueva Reserva Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualType, setManualType] = useState<'TOUR' | 'TRANSFER'>('TOUR');
  const [manualTourId, setManualTourId] = useState(availableTours[0]?.id || '');
  const [manualTransferId, setManualTransferId] = useState(availableTransfers[0]?.id || '');
  const [manualVehicleId, setManualVehicleId] = useState(availableVehicles[0]?.id || '');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualPax, setManualPax] = useState(1);
  const [manualServiceType, setManualServiceType] = useState<'shared' | 'private'>('shared');
  const [manualPrice, setManualPrice] = useState(80);
  const [manualStatus, setManualStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [manualHotel, setManualHotel] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualSpecialReq, setManualSpecialReq] = useState('');
  const [manualMarketingCode, setManualMarketingCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const formatDateToYMD = (d: Date): string => {
    return d.toISOString().slice(0, 10);
  };

  const hasActiveFilters = 
    filterStatus !== 'ALL' || 
    filterType !== 'ALL' || 
    searchQuery.trim() !== '' || 
    sortOrder !== 'newest_created' || 
    startDate !== '' || 
    endDate !== '';

  const clearAllFilters = () => {
    setFilterStatus('ALL');
    setFilterType('ALL');
    setSearchQuery('');
    setSortOrder('newest_created');
    setStartDate('');
    setEndDate('');
  };

  const filteredReservas = reservas
    .filter((reserva) => {
      const matchesStatus = filterStatus === 'ALL' || reserva.status === filterStatus;
      const matchesType = 
        filterType === 'ALL' ||
        (filterType === 'TOUR' && (Boolean(reserva.tour) || Boolean(reserva.tourId))) ||
        (filterType === 'TRANSFER' && (Boolean(reserva.transfer) || Boolean(reserva.transferId)));
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        reserva.customerFirstName.toLowerCase().includes(searchLower) ||
        reserva.customerLastName.toLowerCase().includes(searchLower) ||
        reserva.customerEmail.toLowerCase().includes(searchLower) ||
        (reserva.marketingCode && reserva.marketingCode.toLowerCase().includes(searchLower)) ||
        (reserva.tour?.title && reserva.tour.title.toLowerCase().includes(searchLower)) ||
        (reserva.transfer?.title && reserva.transfer.title.toLowerCase().includes(searchLower)) ||
        (reserva.vehicleType?.name && reserva.vehicleType.name.toLowerCase().includes(searchLower));
      
      let matchesDates = true;
      if (startDate || endDate) {
        const itemDateStr = formatDateToYMD(new Date(reserva.date));
        if (startDate && itemDateStr < startDate) {
          matchesDates = false;
        }
        if (endDate && itemDateStr > endDate) {
          matchesDates = false;
        }
      }

      return matchesStatus && matchesType && matchesSearch && matchesDates;
    })
    .sort((a, b) => {
      if (sortOrder === 'closest_travel') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortOrder === 'furthest_travel') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortOrder === 'newest_created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const isAllSelected = filteredReservas.length > 0 && filteredReservas.every(r => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReservas.map(r => r.id));
    }
  };

  const toggleSelectReserva = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsConfirmOpen(true);
  };

  const executeBulkDelete = () => {
    startTransition(async () => {
      const res = await deleteReservationsAction(selectedIds);
      if (res.success) {
        setReservas(prev => prev.filter(r => !selectedIds.includes(r.id)));
        setSelectedIds([]);
        setIsConfirmOpen(false);
        setFeedback({ type: 'success', message: 'Reservas eliminadas correctamente.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Ocurrió un error al eliminar las reservas.' });
      }
    });
  };

  // Abrir Modal de Creación Manual
  const openManualModal = () => {
    setManualType('TOUR');
    setManualTourId(availableTours[0]?.id || '');
    setManualTransferId(availableTransfers[0]?.id || '');
    setManualVehicleId(availableVehicles[0]?.id || '');
    setManualFirstName('');
    setManualLastName('');
    setManualEmail('');
    setManualPhone('');
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualPax(1);
    setManualServiceType('shared');
    setManualPrice(availableTours[0]?.sharedPrice || 80);
    setManualStatus('PAID');
    setManualHotel('');
    setManualTime('07:00 AM');
    setManualSpecialReq('');
    setManualMarketingCode('');
    setManualError(null);
    setIsManualModalOpen(true);
  };

  // Enviar Reserva Manual
  const handleCreateManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualFirstName.trim() || !manualLastName.trim()) {
      setManualError('Los nombres y apellidos del cliente son obligatorios.');
      return;
    }
    if (!manualEmail.trim()) {
      setManualError('El correo electrónico del cliente es obligatorio.');
      return;
    }
    if (!manualPhone.trim()) {
      setManualError('El teléfono o WhatsApp del cliente es obligatorio.');
      return;
    }

    startTransition(async () => {
      const payload = {
        type: manualType,
        tourId: manualType === 'TOUR' ? manualTourId : undefined,
        transferId: manualType === 'TRANSFER' ? manualTransferId : undefined,
        vehicleTypeId: manualType === 'TRANSFER' ? manualVehicleId : undefined,
        customerFirstName: manualFirstName.trim(),
        customerLastName: manualLastName.trim(),
        customerEmail: manualEmail.trim(),
        customerPhone: manualPhone.trim(),
        date: manualDate,
        pax: manualPax,
        totalPrice: Number(manualPrice),
        serviceType: manualServiceType,
        status: manualStatus,
        pickupHotel: manualHotel.trim() || undefined,
        pickupTime: manualTime.trim() || undefined,
        specialRequirements: manualSpecialReq.trim() || undefined,
        marketingCode: manualMarketingCode.trim() || undefined,
      };

      const res = await createManualReservationAction(payload);
      if (res.success && res.reservation) {
        setReservas(prev => [res.reservation as any, ...prev]);
        setIsManualModalOpen(false);
        setFeedback({ 
          type: 'success', 
          message: `Reserva manual #${res.reservation.code} para ${res.reservation.customerFirstName} ${res.reservation.customerLastName} registrada con éxito.` 
        });
      } else {
        setManualError(res.error || 'Error al registrar la reserva manual.');
      }
    });
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título, DateRangePicker, Botón Nueva Reserva y Contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">Reservas</h1>
        </div>

        {/* Lado derecho: Filtro de fecha + Contador + Botón Verde Estandarizado */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <DateRangePicker 
            startDate={startDate}
            endDate={endDate}
            onApply={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="w-[220px]"
          />

          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs select-none">
            <span className="text-slate-400 font-normal">Total:</span>
            <span className="text-slate-900 font-bold">{reservas.length}</span>
            <span className="text-slate-500 font-medium">{reservas.length === 1 ? 'reserva' : 'reservas'}</span>
          </div>

          <button
            type="button"
            onClick={openManualModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Reserva Manual</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TEMPORAL DE ACCIONES */}
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

      {/* 2. Barra de Filtros y Búsqueda Estilo Shopify Polaris */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Input de Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, correo, tour, traslado o código MK..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Dropdown de Estado */}
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[180px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  {filterStatus === 'ALL' && (
                    <>
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Todos los estados</span>
                    </>
                  )}
                  {filterStatus === 'PAID' && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700">Pagadas</span>
                    </>
                  )}
                  {filterStatus === 'PENDING' && (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-700">Pendientes</span>
                    </>
                  )}
                  {filterStatus === 'CANCELLED' && (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-rose-700">Canceladas</span>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>Todos los estados</span>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="PAID" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pagadas</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.filter(r => r.status === 'PAID').length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="PENDING" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Pendientes</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.filter(r => r.status === 'PENDING').length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="CANCELLED" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Canceladas</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.filter(r => r.status === 'CANCELLED').length})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dropdown de Tipo de Servicio */}
            <Select value={filterType} onValueChange={(val) => setFilterType(val as ServiceTypeFilter)}>
              <SelectTrigger className="h-8 w-[165px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  {filterType === 'ALL' && <span>Todos los tipos</span>}
                  {filterType === 'TOUR' && <span className="text-teal-700 font-semibold">Tours</span>}
                  {filterType === 'TRANSFER' && <span className="text-sky-700 font-semibold">Traslados</span>}
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[165px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>Todos los tipos</span>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="TOUR" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Tours</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.filter(r => r.tour || r.tourId).length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="TRANSFER" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Traslados</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">({reservas.filter(r => r.transfer || r.transferId).length})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Selector de Ordenamiento */}
            <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as SortOption)}>
              <SelectTrigger className="h-8 w-[210px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {sortOrder === 'newest_created' && 'Últimas creadas'}
                    {sortOrder === 'closest_travel' && 'Viaje: Más cercanas'}
                    {sortOrder === 'furthest_travel' && 'Viaje: Más lejanas'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[210px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="newest_created" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>Últimas creadas</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">Defecto</span>
                  </div>
                </SelectItem>
                <SelectItem value="closest_travel" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <span>Fecha de viaje: Más cercanas</span>
                </SelectItem>
                <SelectItem value="furthest_travel" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <span>Fecha de viaje: Más lejanas</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Botón de Limpiar Filtros */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
                hasActiveFilters
                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer'
                  : 'text-slate-400 bg-slate-50/70 border-slate-200/80 cursor-not-allowed opacity-50'
              }`}
              title={hasActiveFilters ? 'Restablecer todos los filtros' : 'No hay filtros activos'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {filteredReservas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <p className="font-semibold text-slate-600">No se encontraron reservas con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          {/* 3. VISTA DESKTOP: TABLA COMPLETA CON SOPORTE DE ATRIBUCIÓN MARKETING */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <colgroup>
                  <col className="w-[3.5%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[28%]" />
                  <col className="w-[11%]" />
                  <col className="w-[5.5%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead>
                  {selectedIds.length > 0 ? (
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                      <th className="px-4 py-3 text-center w-10 shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                        />
                      </th>
                      <th colSpan={8} className="px-4 py-2.5 text-left">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900 text-xs">
                            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleBulkDelete}
                              disabled={isPending}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>{isPending ? 'Borrando...' : 'Borrar seleccionadas'}</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    </tr>
                  ) : (
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-10 shrink-0">
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Servicio Reservado</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Fecha Viaje</th>
                      <th className="px-4 py-3 text-center">PAX</th>
                      <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredReservas.map((reserva) => {
                    const isSelected = selectedIds.includes(reserva.id);
                    const serviceTitle = reserva.tour ? reserva.tour.title : reserva.transfer ? reserva.transfer.title : 'Reserva Turística';
                    return (
                      <tr 
                        key={reserva.id}
                        className={`transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectReserva(reserva.id)}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-left">
                          {reserva.code ? (
                            <span className="font-mono text-[11px] font-semibold bg-slate-100/90 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 inline-block truncate max-w-[125px]">
                              {reserva.code}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="font-semibold text-slate-900 truncate">
                            {reserva.customerFirstName} {reserva.customerLastName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            {reserva.tour ? (
                              <span title="Tour Turístico" className="p-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
                                <Compass size={13} className="text-teal-600" />
                              </span>
                            ) : reserva.transfer ? (
                              <span title="Traslado / Transporte" className="p-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 shrink-0">
                                <Car size={13} className="text-sky-600" />
                              </span>
                            ) : null}
                            <span 
                              className="font-bold text-slate-900 uppercase line-clamp-1 text-xs"
                              title={serviceTitle}
                            >
                              {serviceTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap text-xs font-semibold" suppressHydrationWarning>
                          {new Date(reserva.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-700">
                          {reserva.pax}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          ${reserva.totalPrice.toFixed(2)} USD
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {reserva.status === 'PAID' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> <span>Pagado</span>
                            </span>
                          )}
                          {reserva.status === 'PENDING' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} /> <span>Pendiente</span>
                            </span>
                          )}
                          {reserva.status === 'CANCELLED' && (
                            <span className="inline-flex items-center justify-center gap-1 w-[88px] py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} /> <span>Cancelado</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <Link
                            href={`/reservas/${reserva.id}`}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>Ver detalle</span>
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. VISTA MOBILE */}
          <div className="md:hidden flex flex-col gap-3 w-full min-w-0">
            {filteredReservas.map((reserva) => (
              <div key={reserva.id} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col gap-2.5 w-full min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {reserva.customerFirstName} {reserva.customerLastName}
                      </h4>
                      {reserva.code && (
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          {reserva.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-[#062918] text-xs shrink-0 whitespace-nowrap">
                    ${reserva.totalPrice.toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {reserva.tour ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      <Compass size={11} className="shrink-0 text-teal-600" /> Tour
                    </span>
                  ) : reserva.transfer ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                      <Car size={11} className="shrink-0 text-sky-600" /> Traslado
                    </span>
                  ) : null}
                  {reserva.source && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {reserva.source}
                    </span>
                  )}
                  <div className="text-xs font-semibold text-slate-800 uppercase truncate">
                    {reserva.tour ? reserva.tour.title : reserva.transfer ? reserva.transfer.title : 'Reserva Turística'}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                    {reserva.status === 'PAID' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 size={11} /> Pagado
                      </span>
                    )}
                    {reserva.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <Clock size={11} /> Pendiente
                      </span>
                    )}
                    {reserva.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        <XCircle size={11} /> Cancelado
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">
                      {reserva.pax} pax
                    </span>
                  </div>

                  <Link
                    href={`/reservas/${reserva.id}`}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <span>Ver detalle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL DE NUEVA RESERVA MANUAL */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#008060]" />
              <span>Registrar Nueva Reserva Manual</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ingresa los datos de la reserva coordinada por WhatsApp o teléfono. Podrás registrar el código de atribución de marketing.
            </DialogDescription>
          </DialogHeader>

          {manualError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <form onSubmit={handleCreateManualSubmit} className="space-y-4 pt-2">
            
            {/* 1. Selector de Tipo de Servicio */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tipo de Servicio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualType('TOUR')}
                  className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    manualType === 'TOUR'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Compass className="w-4 h-4 text-teal-600" />
                  <span>Tour Turístico</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('TRANSFER')}
                  className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    manualType === 'TRANSFER'
                      ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Car className="w-4 h-4 text-sky-600" />
                  <span>Traslado Privado</span>
                </button>
              </div>
            </div>

            {/* 2. Selección de Tour o Traslado */}
            {manualType === 'TOUR' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Seleccionar Tour
                </label>
                <select
                  value={manualTourId}
                  onChange={(e) => {
                    setManualTourId(e.target.value);
                    const selected = availableTours.find(t => t.id === e.target.value);
                    if (selected) {
                      setManualPrice(selected.sharedPrice * manualPax);
                    }
                  }}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {availableTours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — ${t.sharedPrice} USD/pax
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ruta de Traslado
                  </label>
                  <select
                    value={manualTransferId}
                    onChange={(e) => setManualTransferId(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {availableTransfers.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={manualVehicleId}
                    onChange={(e) => setManualVehicleId(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. Datos del Cliente */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800 block mb-2">Datos del Cliente</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Michael"
                    value={manualFirstName}
                    onChange={(e) => setManualFirstName(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Brown"
                    value={manualLastName}
                    onChange={(e) => setManualLastName(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@ejemplo.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+51 984 000 000"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 4. Detalles del Viaje */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800 block mb-2">Detalles del Servicio</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Fecha de Viaje</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pasajeros (Pax)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={manualPax}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setManualPax(val);
                      if (manualType === 'TOUR') {
                        const selected = availableTours.find(t => t.id === manualTourId);
                        if (selected) setManualPrice(selected.sharedPrice * val);
                      }
                    }}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Total ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Estado de Pago</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="PAID">Pagado (PAID)</option>
                    <option value="PENDING">Pendiente (PENDING)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hotel de Recojo</label>
                  <input
                    type="text"
                    placeholder="Ej: Marriott Cusco, Calle San Agustín"
                    value={manualHotel}
                    onChange={(e) => setManualHotel(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Horario de Recojo</label>
                  <input
                    type="text"
                    placeholder="Ej: 04:30 AM"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 5. ATRIBUCIÓN MARKETING / CÓDIGO WHATSAPP / CUPÓN */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Código WhatsApp / Cupón de Marketing (Atribución)</span>
                </label>
                {availableCoupons.length > 0 && (
                  <span className="text-[10.5px] font-semibold text-amber-800">
                    {availableCoupons.length} cupones activos
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Ej: MK1, CUMPLE10, HUMANTAY20..."
                value={manualMarketingCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setManualMarketingCode(code);
                  // Si coincide con cupón, informar al operador
                  const match = availableCoupons.find(c => c.code === code);
                  if (match && manualPrice > 0) {
                    // Descuento sugerido opcional
                  }
                }}
                className="w-full h-8 px-3 bg-white border border-amber-300 rounded-lg text-xs font-bold tracking-wider text-amber-950 placeholder:text-amber-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
              />

              {/* Chips de cupones rápidos */}
              {availableCoupons.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-amber-700 font-semibold">Sugeridos:</span>
                  {availableCoupons.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setManualMarketingCode(c.code)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer border ${
                        manualMarketingCode === c.code 
                          ? 'bg-amber-600 text-white border-amber-700 shadow-2xs' 
                          : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {c.code} ({c.discountValue}{c.discountType === 'PERCENTAGE' ? '%' : '$'})
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-amber-800 leading-snug">
                Si el cliente te contactó por WhatsApp con un código de campaña (ej: <strong>MK1</strong>) o un cupón de atracción (ej: <strong>CUMPLE10</strong>), regístralo aquí para sumar <strong>+1 uso realizado</strong> y validar la atribución de Marketing.
              </p>
            </div>

            {/* 6. Footer con Botones */}
            <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="h-9 px-5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white rounded-xl text-xs font-bold shadow-2xs transition-all border border-[#006e52] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar y Crear Reserva</span>
                  </>
                )}
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar reservas */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="¿Eliminar reservas seleccionadas?"
        description={`Se eliminarán de forma permanente ${selectedIds.length} reserva(s) del sistema. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar reservas"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isPending}
        onConfirm={executeBulkDelete}
        onClose={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
