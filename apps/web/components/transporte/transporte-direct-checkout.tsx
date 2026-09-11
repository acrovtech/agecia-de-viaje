'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeftRight, 
  Luggage, 
  Users, 
  Car, 
  MapPin, 
  Plane, 
  Building2, 
  Compass, 
  Train, 
  ChevronDown, 
  Check, 
  RotateCcw, 
  Send, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { TransferRouteData, VehicleOption } from './transporte-route-card';
import { Calendar } from '@/components/ui/calendar';
import { createReservationAndPaymentToken } from '@/app/actions/reservation';
import KRGlue from '@lyracom/embedded-form-glue';

interface DirectCheckoutProps {
  transfers: TransferRouteData[];
}

export function TransporteDirectCheckout({ transfers }: DirectCheckoutProps) {
  const searchParams = useSearchParams();
  const queryFrom = searchParams.get('from') || '';
  const queryTo = searchParams.get('to') || '';

  // 1. Orígenes y Destinos únicos
  const allOrigins = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => {
      if (t.origin) set.add(t.origin);
    });
    return Array.from(set);
  }, [transfers]);

  const allDestinations = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => {
      if (t.destination) set.add(t.destination);
    });
    return Array.from(set);
  }, [transfers]);

  // 2. Estados de Origen y Destino (Sin selección por defecto si no viene de URL)
  const [selectedOrigin, setSelectedOrigin] = useState<string>(queryFrom);
  const [selectedDestination, setSelectedDestination] = useState<string>(queryTo);

  // Destinos disponibles filtrados (Excluye el origen seleccionado y rutas no disponibles)
  const availableDestinations = useMemo(() => {
    if (!selectedOrigin) {
      return allDestinations;
    }
    const matching = transfers
      .filter((t) => t.origin.toLowerCase().includes(selectedOrigin.toLowerCase()) || selectedOrigin.toLowerCase().includes(t.origin.toLowerCase()))
      .map((t) => t.destination)
      .filter((dest) => dest.toLowerCase() !== selectedOrigin.toLowerCase());

    const result = matching.length > 0 
      ? Array.from(new Set(matching)) 
      : allDestinations.filter((d) => d.toLowerCase() !== selectedOrigin.toLowerCase());

    return result;
  }, [transfers, selectedOrigin, allDestinations]);

  // Orígenes disponibles filtrados (Excluye el destino seleccionado)
  const availableOrigins = useMemo(() => {
    if (!selectedDestination) {
      return allOrigins;
    }
    const matching = transfers
      .filter((t) => t.destination.toLowerCase().includes(selectedDestination.toLowerCase()) || selectedDestination.toLowerCase().includes(t.destination.toLowerCase()))
      .map((t) => t.origin)
      .filter((orig) => orig.toLowerCase() !== selectedDestination.toLowerCase());

    const result = matching.length > 0 
      ? Array.from(new Set(matching)) 
      : allOrigins.filter((o) => o.toLowerCase() !== selectedDestination.toLowerCase());

    return result;
  }, [transfers, selectedDestination, allOrigins]);

  // Sincronizar si cambian query params en URL
  useEffect(() => {
    if (queryFrom) setSelectedOrigin(queryFrom);
    if (queryTo) setSelectedDestination(queryTo);
  }, [queryFrom, queryTo]);

  // Dropdowns Open State & Click Outside
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Handlers para selección inteligente
  const handleSelectOrigin = (orig: string) => {
    setSelectedOrigin(orig);
    setIsOriginOpen(false);
    if (selectedDestination && (orig.toLowerCase() === selectedDestination.toLowerCase() || orig.toLowerCase().includes(selectedDestination.toLowerCase()))) {
      setSelectedDestination('');
    }
  };

  const handleSelectDestination = (dest: string) => {
    setSelectedDestination(dest);
    setIsDestOpen(false);
    if (selectedOrigin && (dest.toLowerCase() === selectedOrigin.toLowerCase() || dest.toLowerCase().includes(selectedOrigin.toLowerCase()))) {
      setSelectedOrigin('');
    }
  };

  // 3. Obtener Transfer actual coincidente
  const currentTransfer = useMemo(() => {
    if (!selectedOrigin && !selectedDestination) return null;

    const exact = transfers.find((t) => 
      selectedOrigin && selectedDestination &&
      t.origin.toLowerCase().includes(selectedOrigin.toLowerCase()) &&
      t.destination.toLowerCase().includes(selectedDestination.toLowerCase())
    );
    if (exact) return exact;

    if (selectedOrigin && !selectedDestination) {
      return transfers.find((t) => t.origin.toLowerCase().includes(selectedOrigin.toLowerCase())) || null;
    }

    if (!selectedOrigin && selectedDestination) {
      return transfers.find((t) => t.destination.toLowerCase().includes(selectedDestination.toLowerCase())) || null;
    }

    return null;
  }, [transfers, selectedOrigin, selectedDestination]);

  // 4. Selección de Vehículo
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    if (currentTransfer && currentTransfer.vehicles.length > 0) {
      if (!selectedVehicleId || !currentTransfer.vehicles.some((v) => v.id === selectedVehicleId)) {
        setSelectedVehicleId(currentTransfer.vehicles[0]?.id || '');
      }
    }
  }, [currentTransfer, selectedVehicleId]);

  const selectedVehicle = currentTransfer?.vehicles.find((v) => v.id === selectedVehicleId) || currentTransfer?.vehicles[0];

  // 5. Intercambiar Origen y Destino (Swap)
  const handleSwap = () => {
    const tempOrigin = selectedOrigin;
    const tempDest = selectedDestination;
    setSelectedOrigin(tempDest);
    setSelectedDestination(tempOrigin);
  };

  // Icon Helper para Ubicaciones
  const getLocationIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('aeropuerto') || lower.includes('aerop')) {
      return <Plane className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (lower.includes('tren') || lower.includes('estación') || lower.includes('poroy') || lower.includes('wanchaq')) {
      return <Train className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (lower.includes('hotel') || lower.includes('centro')) {
      return <Building2 className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (lower.includes('soraypampa') || lower.includes('humantay') || lower.includes('valle')) {
      return <Compass className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <MapPin className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  // 6. Campos del Formulario
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>('08:00');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  // 7. Pagos y Estado
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showIzipayModal, setShowIzipayModal] = useState<boolean>(false);

  const totalPrice = selectedVehicle?.price || currentTransfer?.sharedPrice || 0;

  // WhatsApp Submit
  const handleWhatsAppSubmit = () => {
    if (!currentTransfer || !selectedVehicle) {
      setErrorMessage('Por favor selecciona tu punto de origen y destino para cotizar.');
      return;
    }

    const formattedDate = selectedDate
      ? selectedDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Por definir';

    const message = 
      `*SOLICITUD DE TRASLADO / TRANSPORTE*\n\n` +
      `*Ruta:* ${currentTransfer.origin} ➔ ${currentTransfer.destination}\n` +
      `*Vehículo:* ${selectedVehicle.name}\n` +
      `*Fecha de viaje:* ${formattedDate}\n` +
      `*Hora estimada:* ${time || 'Por coordinar'}\n` +
      `*Pasajeros:* Hasta ${selectedVehicle.maxPax} pax\n` +
      `*Total:* USD ${totalPrice}\n\n` +
      `*Nombre:* ${fullName || 'Cliente'}\n` +
      `*Email:* ${email || 'No especificado'}\n` +
      `*Teléfono:* ${phone || 'No especificado'}\n` +
      (notes ? `*Notas:* ${notes}\n\n` : '\n') +
      `¡Hola! Quisiera confirmar la disponibilidad de este traslado.`;

    const whatsappUrl = `https://wa.me/51984772299?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Online Payment (Izipay)
  const handleOnlinePayment = async () => {
    if (!currentTransfer || !selectedVehicle) {
      setErrorMessage('Por favor selecciona un punto de partida y un destino válidos.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Por favor ingresa un número de WhatsApp / Teléfono de contacto.');
      return;
    }
    if (!selectedDate || !dateString) {
      setErrorMessage('Por favor selecciona la fecha de viaje.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Pasajero';

      const res = await createReservationAndPaymentToken({
        tourSlug: currentTransfer.slug,
        tourTitle: `Traslado: ${currentTransfer.origin} a ${currentTransfer.destination}`,
        serviceType: 'private',
        vehicleId: selectedVehicle.id,
        vehicleCode: selectedVehicle.code,
        pickupTime: time,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        specialRequirements: notes,
        date: dateString,
        pax: selectedVehicle.maxPax || 1,
      });

      if (!res.success || !res.formToken) {
        setErrorMessage(res.error || 'No se pudo generar la pasarela de pago. Por favor intenta por WhatsApp.');
        setIsProcessing(false);
        return;
      }

      // Open Izipay Embedded Popin
      setShowIzipayModal(true);

      const endpoint = process.env.NEXT_PUBLIC_IZIPAY_ENDPOINT || 'https://api.micuentaweb.pe';
      const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY || '81438965:testpublickey_DEMOPUBLICKEY99999999999999999';

      const { KR } = await KRGlue.loadLibrary(endpoint, publicKey);
      await KR.setFormConfig({
        formToken: res.formToken,
        'kr-language': 'es-ES',
      });

      await KR.attachForm('#izipay-transfer-popin');
      await KR.showForm('#izipay-transfer-popin');

      KR.onSubmit(async (paymentData: any) => {
        if (paymentData.clientAnswer?.orderStatus === 'PAID') {
          setIsSuccess(true);
          setShowIzipayModal(false);
          return true;
        }
        return false;
      });
    } catch (err: any) {
      console.error('Payment token error:', err);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedDateDisplay = selectedDate
    ? selectedDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const hasActiveFilters = Boolean(selectedOrigin || selectedDestination);
  const isRouteReady = Boolean(currentTransfer && selectedVehicle);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl" suppressHydrationWarning>
      {isSuccess ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-[#062918] font-heading">
            ¡Reserva de Traslado Confirmada!
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Hemos recibido tu pago y los detalles del traslado. Te hemos enviado la confirmación y voucher a <strong>{email}</strong>.
          </p>
          <div className="pt-4">
            <a
              href="/"
              className="inline-block px-7 py-2.5 rounded-xl bg-[#062918] text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#008060] transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================================= */}
          {/* COLUMNA IZQUIERDA: FORMULARIO DIRECTO (8 COLS) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-5 sm:p-7 shadow-xs space-y-6">
            
            {/* 1. Selector de 2 Selects: DESDE y HASTA */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider font-heading">
                  1. Ruta del Traslado *
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrigin('');
                      setSelectedDestination('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#062918] transition-colors py-0.5 px-2 rounded-lg hover:bg-emerald-50/60"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar selección</span>
                  </button>
                )}
              </div>

              {/* Controles de Ruta (Desktop: 12 columnas | Mobile: Stack con botón abajo) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Dropdown DESDE (Desktop: 5 cols | Mobile: Full) */}
                <div ref={originRef} className="md:col-span-5 relative">
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Desde</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOriginOpen(!isOriginOpen);
                      setIsDestOpen(false);
                      setIsCalendarOpen(false);
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white text-left text-xs sm:text-sm font-medium text-gray-900 flex items-center justify-between transition-all hover:border-gray-300 focus:border-gray-400 focus:bg-white outline-none focus:outline-none"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      {selectedOrigin ? getLocationIcon(selectedOrigin) : <MapPin className="w-4 h-4 text-gray-400 shrink-0" />}
                      <span className={`truncate ${!selectedOrigin ? 'text-gray-400 font-normal' : 'text-gray-900'}`}>
                        {selectedOrigin || 'Seleccionar origen'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-300 ${isOriginOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOriginOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {availableOrigins.map((orig) => {
                        const isSelected = selectedOrigin === orig;
                        return (
                          <button
                            key={orig}
                            type="button"
                            onClick={() => handleSelectOrigin(orig)}
                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                              isSelected ? 'font-semibold text-[#062918] bg-emerald-50/50' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {getLocationIcon(orig)}
                              <span className="truncate">{orig}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#062918] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botón SWAP DESKTOP (2 cols) */}
                <div className="hidden md:flex md:col-span-2 items-center justify-center pt-4">
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Intercambiar origen y destino"
                    className="w-9 h-9 rounded-full bg-[#062918] hover:bg-[#008060] text-white flex items-center justify-center transition-all duration-200 shadow-2xs active:scale-90"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dropdown HASTA (Desktop: 5 cols | Mobile: Full) */}
                <div ref={destRef} className="md:col-span-5 relative">
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    <span>Hasta</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDestOpen(!isDestOpen);
                      setIsOriginOpen(false);
                      setIsCalendarOpen(false);
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white text-left text-xs sm:text-sm font-medium text-gray-900 flex items-center justify-between transition-all hover:border-gray-300 focus:border-gray-400 focus:bg-white outline-none focus:outline-none"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      {selectedDestination ? getLocationIcon(selectedDestination) : <MapPin className="w-4 h-4 text-gray-400 shrink-0" />}
                      <span className={`truncate ${!selectedDestination ? 'text-gray-400 font-normal' : 'text-gray-900'}`}>
                        {selectedDestination || 'Elegir destino'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-300 ${isDestOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDestOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {availableDestinations.map((dest) => {
                        const isSelected = selectedDestination === dest;
                        return (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => handleSelectDestination(dest)}
                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                              isSelected ? 'font-semibold text-[#062918] bg-rose-50/50' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {getLocationIcon(dest)}
                              <span className="truncate">{dest}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#062918] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Fila Inferior MOBILE: Card Outline de Duración & Solo Ida a la izquierda y Botón Rectangular "Intercambiar" a la derecha */}
              <div className="flex md:hidden items-center justify-between pt-1">
                {currentTransfer ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200/90 bg-gray-50/70 text-xs font-semibold text-gray-700 shadow-2xs">
                    <span>{currentTransfer.duration}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-normal">Solo ida</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Selecciona una ruta</span>
                )}

                <button
                  type="button"
                  onClick={handleSwap}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 border border-gray-200/60"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-600" />
                  <span>Intercambiar</span>
                </button>
              </div>

              {/* Card Outline DESKTOP (Duración & Solo ida) */}
              {currentTransfer && (
                <div className="hidden md:flex items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200/90 bg-gray-50/70 text-xs font-semibold text-gray-700 shadow-2xs">
                    <span>{currentTransfer.duration}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-normal">Solo ida</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Seleccionar Vehículo * (Grilla Minimalista con Borde Fino) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider font-heading">
                2. Selecciona tu Vehículo *
              </label>

              {currentTransfer && currentTransfer.vehicles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentTransfer.vehicles.map((veh) => {
                    const isSelected = selectedVehicleId === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => setSelectedVehicleId(veh.id)}
                        className={`cursor-pointer rounded-xl p-3.5 transition-all duration-200 ease-out flex flex-col items-center justify-between text-center select-none border ${
                          isSelected
                            ? 'bg-sky-50/80 border-[#062918] shadow-2xs transform -translate-y-0.5'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-2xs hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Imagen */}
                        <div className="w-full h-20 relative flex items-center justify-center mb-1.5">
                          {veh.image ? (
                            <img
                              src={veh.image}
                              alt={veh.name}
                              className="max-h-full max-w-full object-contain drop-shadow-sm rounded-lg"
                            />
                          ) : (
                            <Car className="w-8 h-8 text-gray-300" />
                          )}
                        </div>

                        {/* Título */}
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 font-heading line-clamp-1 mb-1">
                          {veh.name}
                        </div>

                        {/* Capacidad */}
                        <div className="flex items-center justify-center gap-2.5 text-[11px] text-gray-500 font-medium mb-1.5">
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
                        <div className="text-sm font-semibold text-[#062918] font-heading">
                          USD {veh.price}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-gray-200 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span>Por favor selecciona tu punto de origen y destino arriba para ver los vehículos disponibles.</span>
                </div>
              )}
            </div>

            {/* 3. Fecha (Custom Calendar) y Hora de Recojo Libre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Calendario Personalizado */}
              <div ref={calendarRef} className="space-y-1.5 relative">
                <label className="block text-xs font-semibold text-gray-700">
                  Fecha de viaje *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarOpen(!isCalendarOpen);
                    setIsOriginOpen(false);
                    setIsDestOpen(false);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white text-left text-xs sm:text-sm font-medium text-gray-900 flex items-center justify-between transition-all hover:border-gray-300 focus:border-gray-400 focus:bg-white outline-none focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className={`truncate ${!selectedDate ? 'text-gray-400 font-normal' : 'text-gray-900'}`}>
                      {selectedDate 
                        ? selectedDate.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Seleccionar fecha de viaje'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-300 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCalendarOpen && (
                  <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-80 mt-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <Calendar
                      selectedDate={selectedDate}
                      onSelect={handleSelectDate}
                    />
                  </div>
                )}
              </div>

              {/* Hora de recojo libre / sin restricciones */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Hora de recojo (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-gray-800 outline-none focus:outline-none focus:border-gray-400 transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>

            </div>

            {/* 4. Datos del Pasajero / Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch pt-1">
              
              {/* Campos de texto izquierda */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-gray-800 outline-none focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-gray-800 outline-none focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    WhatsApp / Teléfono *
                  </label>
                  <input
                    type="tel"
                    placeholder="Código de país + número de teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-gray-800 outline-none focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              {/* Notas adicionales derecha */}
              <div className="space-y-1 flex flex-col">
                <label className="block text-xs font-semibold text-gray-700">
                  Notas adicionales (Opcional)
                </label>
                <textarea
                  rows={5}
                  placeholder="Requisitos especiales, nombre del hotel, número de vuelo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full flex-1 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-medium text-gray-800 outline-none focus:outline-none focus:border-gray-400 resize-none transition-colors"
                />
              </div>

            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* COLUMNA DERECHA: RESUMEN DE RESERVA Y BOTONES DE PAGO (4 COLS STICKY) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5 lg:sticky lg:top-24">
            
            <h3 className="text-sm sm:text-base font-semibold text-[#062918] font-heading pb-3 border-b border-gray-100">
              Resumen de reserva
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Servicio</span>
                <span className="font-semibold text-gray-900 leading-snug">
                  {currentTransfer ? `${currentTransfer.origin} ➔ ${currentTransfer.destination}` : 'Selecciona una ruta'}
                </span>
              </div>

              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Vehículo</span>
                <span className="font-semibold text-gray-900">
                  {selectedVehicle?.name || '—'}
                </span>
              </div>

              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Fecha de viaje</span>
                <span className="font-semibold text-gray-900">
                  {formattedDateDisplay}
                </span>
              </div>

              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Hora de recojo</span>
                <span className="font-semibold text-gray-900">
                  {time ? `${time} hrs` : '—'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Total</span>
              <span className="text-xl sm:text-2xl font-bold text-[#062918] font-heading">
                {totalPrice > 0 ? `USD ${totalPrice}` : '—'}
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2.5 pt-1">
              
              <button
                type="button"
                onClick={handleOnlinePayment}
                disabled={isProcessing || !isRouteReady}
                className="w-full py-3 px-4 rounded-xl bg-[#062918] hover:bg-[#008060] text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>PAGAR ONLINE (IZIPAY)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppSubmit}
                disabled={!isRouteReady}
                className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Solicitar por WhatsApp</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center font-medium">
                No se requiere pago anticipado para solicitudes por WhatsApp.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transacción segura y encriptada SSL</span>
            </div>

          </div>

        </div>
      )}

      {/* Modal Izipay Popin Container */}
      {showIzipayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowIzipayModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-semibold"
            >
              ✕
            </button>
            <h3 className="text-base font-semibold text-gray-900 mb-4 font-heading text-center">
              Pagar Traslado con Izipay
            </h3>
            <div id="izipay-transfer-popin" className="min-h-[280px] flex items-center justify-center"></div>
          </div>
        </div>
      )}

    </div>
  );
}
