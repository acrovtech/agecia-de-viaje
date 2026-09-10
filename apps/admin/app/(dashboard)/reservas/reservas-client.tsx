'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour, Transfer, VehicleType } from '@repo/db';
import Link from 'next/link';
import { Search, Calendar, CheckCircle2, Clock, XCircle, ArrowRight, Trash2, Compass, Car, ArrowUpDown, X, Filter, RotateCcw, Layers } from 'lucide-react';
import { deleteReservationsAction } from '@/app/actions/reservation';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type ReservationWithRelations = Reservation & { 
  tour: Tour | null;
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
};

type SortOption = 'newest_created' | 'closest_travel' | 'furthest_travel';
type ServiceTypeFilter = 'ALL' | 'TOUR' | 'TRANSFER';

export function ReservasClient({ initialReservas }: { initialReservas: ReservationWithRelations[] }) {
  const [reservas, setReservas] = useState(initialReservas);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<ServiceTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest_created');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
      } else {
        alert(res.error || 'Ocurrió un error al eliminar las reservas.');
      }
    });
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título, DateRangePicker y Cantidad de Reservas estilo Outline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">Reservas</h1>
        </div>

        {/* Lado derecho: Calendario + Cantidad de reservas estilo Outline */}
        <div className="flex items-center gap-2.5 shrink-0">
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
            className="w-[240px]"
          />

          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs select-none">
            <span className="text-slate-400 font-normal">Total:</span>
            <span className="text-slate-900 font-bold">{reservas.length}</span>
            <span className="text-slate-500 font-medium">{reservas.length === 1 ? 'reserva' : 'reservas'}</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda Estilo Shopify Polaris con Anchos Correspondientes a su Dropdown */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Input de Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, correo, tour o traslado..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Dropdown de Estado con ancho igual al dropdown (w-[180px]) */}
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

            {/* Dropdown de Tipo de Servicio con ancho igual al dropdown (w-[165px]) */}
            <Select value={filterType} onValueChange={(val) => setFilterType(val as ServiceTypeFilter)}>
              <SelectTrigger className="h-8 w-[165px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  {filterType === 'ALL' && (
                    <>
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Servicio: Todos</span>
                    </>
                  )}
                  {filterType === 'TOUR' && (
                    <>
                      <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="text-teal-700">Tours</span>
                    </>
                  )}
                  {filterType === 'TRANSFER' && (
                    <>
                      <Car className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="text-sky-700">Traslados</span>
                    </>
                  )}
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

            {/* Selector de Ordenamiento con ancho igual al dropdown (w-[210px]) */}
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
          {/* 3. VISTA DESKTOP: TABLA COMPLETA NORMALIZADA SEGÚN TAB DE TOURS */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[18%]" />
                <col className="w-[27%]" />
                <col className="w-[11%]" />
                <col className="w-[5%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                {selectedIds.length > 0 ? (
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                    <th colSpan={9} className="px-4 py-2.5 text-left">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-300/80">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                          />
                          <span className="font-semibold text-slate-900 text-xs">
                            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>{isPending ? 'Borrando...' : 'Borrar todos'}</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-8">
                      <input 
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Servicio Reservado</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Fecha Viaje</th>
                    <th className="px-4 py-3 text-center">PAX</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredReservas.map((reserva) => {
                  const isSelected = selectedIds.includes(reserva.id);
                  const serviceTitle = reserva.tour ? reserva.tour.title : reserva.transfer ? reserva.transfer.title : 'RESERVA INCA BOUND';
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
                        <div className="font-semibold text-slate-900 truncate">{reserva.customerFirstName} {reserva.customerLastName}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{reserva.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-left font-semibold text-slate-900">
                        <div 
                          className="font-bold text-slate-900 uppercase line-clamp-1 text-xs"
                          title={serviceTitle}
                        >
                          {serviceTitle}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap text-xs font-semibold">
                        {new Date(reserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {reserva.pax}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        ${reserva.totalPrice.toFixed(2)} USD
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {reserva.tour ? (
                          <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Compass size={12} className="shrink-0 text-teal-600" />
                            <span>Tour</span>
                          </span>
                        ) : reserva.transfer ? (
                          <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <Car size={12} className="shrink-0 text-sky-600" />
                            <span>Traslado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 w-[82px] py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                            <span>General</span>
                          </span>
                        )}
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
                        <div className="flex items-center justify-center">
                          <Link
                            href={`/reservas/${reserva.id}`}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>Ver detalle</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. VISTA MOBILE: CARDS INDEPENDIENTES SIN CHECKBOX NI ENVOLTORIO EXTERIOR */}
          <div className="md:hidden flex flex-col gap-3 w-full min-w-0">
            {filteredReservas.map((reserva) => (
              <div key={reserva.id} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col gap-2.5 w-full min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs truncate">
                      {reserva.customerFirstName} {reserva.customerLastName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{reserva.customerEmail}</p>
                  </div>
                  <span className="font-extrabold text-[#062918] text-xs shrink-0 whitespace-nowrap">
                    ${reserva.totalPrice.toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {reserva.tour ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      <Compass size={11} className="shrink-0 text-teal-600" /> Tour
                    </span>
                  ) : reserva.transfer ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                      <Car size={11} className="shrink-0 text-sky-600" /> Traslado
                    </span>
                  ) : null}
                  <div className="text-xs font-semibold text-slate-800 uppercase truncate">
                    {reserva.tour ? reserva.tour.title : reserva.transfer ? reserva.transfer.title : 'RESERVA INCA BOUND'}
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
                      {reserva.pax} {reserva.pax === 1 ? 'pax' : 'pax'}
                    </span>
                  </div>

                  <Link
                    href={`/reservas/${reserva.id}`}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    title="Ver detalle"
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

      {/* Modal de confirmación para eliminar reservas */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeBulkDelete}
        isLoading={isPending}
        title={`¿Eliminar ${selectedIds.length} reservas seleccionadas?`}
        description="Esta acción es irreversible y eliminará permanentemente los registros de las reservas seleccionadas."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
