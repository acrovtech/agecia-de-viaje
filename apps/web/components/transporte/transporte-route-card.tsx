'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Clock, 
  Car, 
  Check, 
  ArrowRight,
  Users,
  Luggage,
  Calendar as CalendarIcon,
  Send,
  CreditCard,
  Minus,
  Plus
} from 'lucide-react';
import { Calendar } from '../ui/calendar';

export interface VehicleOption {
  id: string;
  code: string;
  name: string;
  subtitle?: string | null;
  maxPax: number;
  maxLuggage: number;
  image: string;
  price: number;
  features?: string[];
}

export interface TransferRouteData {
  id: string;
  title: string;
  slug: string;
  origin: string;
  destination: string;
  duration: string;
  tripType: string;
  hasSharedService: boolean;
  sharedPrice?: number | null;
  hasPrivateService: boolean;
  vehicles: VehicleOption[];
}

interface RouteCardProps {
  transfer: TransferRouteData;
}

export function TransporteRouteCard({ transfer }: RouteCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [serviceType, setServiceType] = useState<'private' | 'shared'>('private');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    transfer.vehicles[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState('08:00');
  const [pax, setPax] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedVehicle = transfer.vehicles.find((v) => v.id === selectedVehicleId) || transfer.vehicles[0];

  // Cálculo del precio base más económico para el header
  let lowestBasePrice = 20;
  let baseUnit = 'vehículo';
  const lowestVehiclePrice = transfer.vehicles.length > 0
    ? Math.min(...transfer.vehicles.map((v) => v.price))
    : null;

  if (transfer.hasSharedService && transfer.sharedPrice && (!lowestVehiclePrice || transfer.sharedPrice < lowestVehiclePrice)) {
    lowestBasePrice = transfer.sharedPrice;
    baseUnit = 'persona';
  } else if (lowestVehiclePrice !== null) {
    lowestBasePrice = lowestVehiclePrice;
    baseUnit = 'vehículo';
  } else if (transfer.sharedPrice) {
    lowestBasePrice = transfer.sharedPrice;
    baseUnit = 'persona';
  }

  // Cálculo del precio total según la configuración actual
  const currentTotal = serviceType === 'private'
    ? (selectedVehicle?.price || lowestBasePrice)
    : (transfer.sharedPrice || 25) * pax;

  const currentPricePerUnit = serviceType === 'private'
    ? (selectedVehicle?.price || lowestBasePrice)
    : (transfer.sharedPrice || 25);

  const maxAllowedPax = serviceType === 'private'
    ? (selectedVehicle?.maxPax || 4)
    : 15;

  const handlePaxChange = (delta: number) => {
    const next = pax + delta;
    if (next >= 1 && next <= maxAllowedPax) {
      setPax(next);
      setValidationError(null);
    }
  };

  const handleDirectCheckout = () => {
    if (!selectedDate) {
      setValidationError('Por favor selecciona una fecha de viaje para continuar');
      return;
    }
    setValidationError(null);

    const dateStr = selectedDate.toISOString();
    const query = new URLSearchParams({
      slug: transfer.slug,
      tourTitle: `Traslado: ${transfer.origin} a ${transfer.destination}`,
      date: dateStr,
      pax: pax.toString(),
      type: serviceType,
      price: currentPricePerUnit.toString(),
      total: currentTotal.toString(),
      transferId: transfer.id,
      pickupTime: pickupTime || 'Por confirmar',
      ...(serviceType === 'private' && selectedVehicle ? { vehicleId: selectedVehicle.id, vehicleName: selectedVehicle.name } : {}),
      ...(selectedVehicle?.image ? { image: selectedVehicle.image } : {})
    });

    router.push(`/checkout?${query.toString()}`);
  };

  const handleWhatsAppQuote = () => {
    const dateFormatted = selectedDate
      ? selectedDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Por definir';

    const vehicleText = serviceType === 'private' ? selectedVehicle?.name : 'Servicio Compartido';

    const text =
      `*SOLICITUD DE TRASLADO / TRANSPORTE*\n\n` +
      `*Ruta:* ${transfer.origin} ➔ ${transfer.destination}\n` +
      `*Servicio:* ${serviceType === 'private' ? `Privado (${vehicleText})` : 'Compartido'}\n` +
      `*Fecha de viaje:* ${dateFormatted}\n` +
      `*Hora estimada:* ${pickupTime || 'Por confirmar'}\n` +
      `*Pasajeros:* ${pax}\n` +
      `*Total Estimado:* $${currentTotal} USD\n\n` +
      `¡Hola IncaBound! Quisiera coordinar este traslado.`;

    const whatsappNumber = '51984000000';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:border-[#062918] hover:shadow-md overflow-hidden">
      
      {/* Cabecera / Barra Principal de la Ruta */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-white transition-colors duration-200 hover:bg-slate-50/50"
      >
        {/* Trayecto: Inicio -> Duración -> Destino */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Inicio */}
          <div className="md:col-span-4 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-heading">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Inicio</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#062918] font-heading leading-snug">
              {transfer.origin}
            </div>
          </div>

          {/* Duración / Trayecto badge */}
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="w-full flex items-center gap-2">
              <div className="h-[1px] flex-1 bg-gray-200 hidden md:block"></div>
              <div className="bg-white border border-gray-200 px-3.5 py-1 rounded-full text-center shrink-0 shadow-2xs">
                <div className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                  <span>{transfer.duration}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  ➔ {transfer.tripType}
                </div>
              </div>
              <div className="h-[1px] flex-1 bg-gray-200 hidden md:block"></div>
            </div>
          </div>

          {/* Destino */}
          <div className="md:col-span-4 space-y-0.5 md:text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 font-heading">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Destino</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#062918] font-heading leading-snug">
              {transfer.destination}
            </div>
          </div>

        </div>

        {/* Precio en 1 SOLA FILA (Arriba) y Botón Ver Detalle con Ancho Fijo (Abajo) */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
          <div className="flex items-baseline gap-1.5 text-left md:text-right">
            <span className="text-xs text-gray-500 font-medium">Desde</span>
            <span className="text-xl sm:text-2xl font-bold text-[#062918] font-heading">
              ${lowestBasePrice}
            </span>
            <span className="text-xs font-bold text-gray-500">USD</span>
            <span className="text-xs text-gray-500 font-medium">
              / {baseUnit}
            </span>
          </div>

          <button
            type="button"
            className="w-[155px] py-1.5 rounded-full border border-gray-200 hover:border-[#062918] bg-white hover:bg-slate-50 text-xs font-bold text-[#062918] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-2xs"
          >
            <span>{isExpanded ? 'Ocultar detalle' : 'Ver detalle'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#062918] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>

      </div>

      {/* Panel Expandido / Configuración de Reserva Directa */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden border-t border-gray-100 bg-slate-50/60">
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* 1. Selector de Tipo de Servicio: Privado / Compartido */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-heading">
                  1. Modalidad de Servicio
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {serviceType === 'private' 
                    ? 'Vehículo exclusivo para ti y tu grupo (tarifa plana por auto).' 
                    : 'Tarifa compartida por pasajero.'}
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-200/80 p-1 border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('private');
                    setValidationError(null);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    serviceType === 'private'
                      ? 'bg-white text-[#062918] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Servicio Privado
                </button>
                {transfer.hasSharedService && (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('shared');
                      setValidationError(null);
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      serviceType === 'shared'
                        ? 'bg-white text-[#062918] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Compartido (${transfer.sharedPrice} USD/pax)
                  </button>
                )}
              </div>
            </div>

            {/* 2. Selector de Flota si es Privado (Estilo Tarjetas Limpias) */}
            {serviceType === 'private' && (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-heading">
                  2. Selecciona tu Vehículo *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {transfer.vehicles.map((veh) => {
                    const isSelected = selectedVehicleId === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => {
                          setSelectedVehicleId(veh.id);
                          if (pax > veh.maxPax) setPax(veh.maxPax);
                          setValidationError(null);
                        }}
                        className={`cursor-pointer rounded-xl p-3.5 transition-all duration-300 ease-out flex flex-col items-center justify-between text-center select-none ${
                          isSelected
                            ? 'bg-sky-50/80 border-[#062918] ring-2 ring-[#062918] shadow-xs transform -translate-y-0.5'
                            : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Imagen del Vehículo */}
                        <div className="w-full h-24 relative flex items-center justify-center mb-2">
                          {veh.image ? (
                            <img
                              src={veh.image}
                              alt={veh.name}
                              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Car className="w-10 h-10 text-gray-300" />
                          )}
                        </div>

                        {/* Nombre del Vehículo */}
                        <div className="text-xs sm:text-sm font-bold text-gray-900 font-heading line-clamp-1 mb-1">
                          {veh.name}
                        </div>

                        {/* Capacidad: Maletas y Pasajeros en 1 fila */}
                        <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 font-medium mb-2">
                          <span className="inline-flex items-center gap-1">
                            <Luggage className="w-3.5 h-3.5 text-gray-400" />
                            <span>{veh.maxLuggage}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>{veh.maxPax}</span>
                          </span>
                        </div>

                        {/* Precio */}
                        <div className="text-sm sm:text-base font-extrabold text-[#062918] font-heading">
                          USD {veh.price}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Selección de Fecha, Hora y Pasajeros */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-heading">
                {serviceType === 'private' ? '3.' : '2.'} Detalles del Viaje
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                
                {/* Selector de Fecha */}
                <div className="relative">
                  <span className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de traslado *</span>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                      selectedDate 
                        ? 'border-[#062918] bg-emerald-50/20 text-[#062918] font-semibold' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#0d9488]" />
                      <span>
                        {selectedDate
                          ? selectedDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Seleccionar fecha'}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-400">Elegir</span>
                  </button>

                  {isCalendarOpen && (
                    <div className="absolute top-full left-0 mt-2 z-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                      <Calendar
                        selectedDate={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d);
                          setIsCalendarOpen(false);
                          setValidationError(null);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Hora estimada de recogida */}
                <div>
                  <span className="block text-[11px] font-semibold text-gray-500 mb-1">Hora estimada de recogida</span>
                  <div className="relative">
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#062918]"
                    />
                  </div>
                </div>

                {/* Contador de Pasajeros */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-500">Pasajeros</span>
                    {serviceType === 'private' && (
                      <span className="text-[10px] text-gray-400">Máx {selectedVehicle?.maxPax} pax</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
                    <button
                      type="button"
                      onClick={() => handlePaxChange(-1)}
                      disabled={pax <= 1}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-gray-900">{pax} {pax === 1 ? 'persona' : 'personas'}</span>
                    <button
                      type="button"
                      onClick={() => handlePaxChange(1)}
                      disabled={pax >= maxAllowedPax}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {validationError && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                  ⚠️ {validationError}
                </div>
              )}
            </div>

            {/* 4. Barra Inferior de Total y Acciones Directas (Sin modal redundante) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs transition-all duration-300">
              <div className="flex items-center gap-3 text-left w-full md:w-auto">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Car className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                    {serviceType === 'private' ? `Privado (${selectedVehicle?.name})` : `Compartido (${pax} pax)`}
                  </div>
                  <div className="text-xl font-bold text-[#062918] font-heading">
                    Total: ${currentTotal} <span className="text-xs font-normal text-gray-500">USD</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Directa */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleDirectCheckout}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#062918] hover:bg-[#008060] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>RESERVAR Y PAGAR ONLINE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppQuote}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>COTIZAR WHATSAPP</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
