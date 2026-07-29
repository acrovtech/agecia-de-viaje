'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, UserCheck, Users, 
  Info, Compass, Calendar, Ticket, Tag, DollarSign, Edit3, X, CheckCircle2,
  AlertTriangle, Minus, Plus, RefreshCw, ShoppingBag
} from 'lucide-react';
import Image from 'next/image';
import { createReservationAndPaymentToken } from '../actions/reservation';
import KRGlue from '@lyracom/embedded-form-glue';
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';

import { useCartManager } from '@/hooks/use-cart';
import { formatSpanishDate } from '@repo/ui/lib/date-utils';
import { formatCurrency } from '@repo/ui/lib/currency';
import { Calendar as CalendarUI } from '@/components/ui/calendar';

type Passenger = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
};

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extraer parámetros de la URL
  const tourTitle = searchParams.get('tourTitle') || 'Tour Inca Bound';
  const tourSlug = searchParams.get('slug') || '';
  const tourImage = searchParams.get('image');
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const price = searchParams.get('price') || '0';
  const total = searchParams.get('total') || '0';
  const privatePriceStr = searchParams.get('privatePrice');
  const durationStr = searchParams.get('duration');

  const numPax = Math.max(1, parseInt(pax) || 1);

  const { cartItems, remainingMinutes, updateCart, removeItemBySlug, removeItem } = useCartManager();

  // Sincronizar item de la URL con el carrito global en localStorage
  useEffect(() => {
    if (tourTitle && tourSlug) {
      updateCart({
        tourSlug,
        tourTitle,
        image: tourImage,
        date: dateStr,
        pax: numPax,
        serviceType,
        price: parseFloat(price) || 0,
        totalPrice: parseFloat(total) || 0,
      });
    }
  }, [tourTitle, tourSlug, tourImage, dateStr, numPax, serviceType, price, total, updateCart]);

  // Lista de tours activos (Soporta multi-tour)
  const activeItems = cartItems.length > 0 ? cartItems : (tourSlug ? [{
    tourSlug,
    tourTitle,
    image: tourImage,
    date: dateStr,
    pax: numPax,
    serviceType,
    price: parseFloat(price) || 0,
    totalPrice: parseFloat(total) || (numPax * (parseFloat(price) || 0)),
    createdAt: Date.now()
  }] : []);

  const grandTotal = activeItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // Estado del Modal de Edición de Tour
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<typeof activeItems[0] | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(new Date());
  const [modalPax, setModalPax] = useState<number>(1);
  const [modalServiceType, setModalServiceType] = useState<'shared' | 'private'>('shared');

  const openEditModal = (tourItem: typeof activeItems[0]) => {
    setEditingTour(tourItem);
    setModalDate(tourItem.date ? new Date(tourItem.date) : new Date());
    setModalPax(tourItem.pax);
    setModalServiceType(tourItem.serviceType === 'private' ? 'private' : 'shared');
    setIsEditModalOpen(true);
  };

  const handleUpdateReservation = () => {
    if (!modalDate || !editingTour) return;
    const itemPrice = editingTour.price || parseFloat(price) || 0;
    const newPricePerPax = modalServiceType === 'private' && privatePriceStr ? (parseFloat(privatePriceStr) || itemPrice) : itemPrice;
    const newTotal = newPricePerPax * modalPax;
    const newDateStr = modalDate.toISOString();

    updateCart({
      ...editingTour,
      date: newDateStr,
      pax: modalPax,
      serviceType: modalServiceType,
      price: newPricePerPax,
      totalPrice: newTotal,
    });

    setIsEditModalOpen(false);
  };

  // Formato de fechas en español unificado (DRY)
  const formattedStartDate = formatSpanishDate(dateStr, 'long');
  const formattedStartDateShort = formatSpanishDate(dateStr, 'short');
  const formattedEndDate = formattedStartDate;
  const formattedEndDateShort = formattedStartDateShort;

  // Control del Stepper (Paso 1: Reserva | Paso 2: Pasajeros | Paso 3: Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hotel: '',
    language: 'Español',
    requirements: ''
  });

  const maxPax = activeItems.length > 0 ? Math.max(...activeItems.map(item => item.pax)) : numPax;

  // Estado de pasajeros (Basado en la cantidad máxima de viajeros del grupo en el carrito)
  const [passengers, setPassengers] = useState<Passenger[]>(() => 
    Array.from({ length: maxPax }, () => ({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
    }))
  );

  // Sincronizar dinámicamente la cantidad de formularios de pasajeros según el valor máximo de pax (maxPax)
  useEffect(() => {
    setPassengers(prev => {
      if (prev.length === maxPax) return prev;
      if (prev.length < maxPax) {
        const added = Array.from({ length: maxPax - prev.length }, () => ({
          firstName: '',
          lastName: '',
          documentType: 'DNI',
          documentNumber: '',
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, maxPax);
    });
  }, [maxPax]);

  const [copiedPax1, setCopiedPax1] = useState(false);
  const [showLanguageTooltip, setShowLanguageTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Estilos UI normalizados
  const inputBaseStyle = "w-full h-[38px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs focus:border-[#062918] focus:ring-1 focus:ring-[#062918]/25 outline-none transition-all";

  // Copiar datos del Pasajero 1 al Titular de contacto (Nombres y Apellidos)
  const copyPax1ToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const pax1 = passengers[0];
    if (pax1 && (pax1.firstName || pax1.lastName)) {
      setFormData(prev => ({
        ...prev,
        firstName: pax1.firstName,
        lastName: pax1.lastName,
      }));
      setCopiedPax1(true);
      setTimeout(() => setCopiedPax1(false), 2500);
    }
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Validar y avanzar al Paso 3 (Inicio de Pago con Izipay)
  const handleProceedToStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar titular de contacto
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setStep2Error('Por favor completa todos los campos requeridos del titular de contacto.');
      return;
    }

    // Validar al menos nombres y apellidos de cada pasajero
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p?.firstName.trim() || !p?.lastName.trim() || !p?.documentNumber.trim()) {
        setStep2Error(`Por favor completa los nombres, apellidos y número de documento del Pasajero #${i + 1}.`);
        return;
      }
    }

    if (!termsAccepted) {
      setStep2Error('Debes aceptar los términos y condiciones para continuar con la reserva.');
      return;
    }

    setStep2Error(null);
    setIsLoading(true);

    try {
      const paxSummary = passengers.map((p, idx) => 
        `Pax ${idx + 1}: ${p.firstName} ${p.lastName} (${p.documentType}: ${p.documentNumber || 'N/A'})`
      ).join(' | ');

      const langInfo = `Idioma: ${formData.language}`;
      const notes = formData.requirements ? `Notas: ${formData.requirements}` : '';

      const fullRequirements = [langInfo, notes, `[Pasajeros: ${paxSummary}]`].filter(Boolean).join(' | ');

      const result = await createReservationAndPaymentToken({
        tourSlug,
        tourTitle,
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        pickupHotel: formData.hotel,
        specialRequirements: fullRequirements,
        date: dateStr || new Date().toISOString(),
        pax: numPax,
        totalPrice: parseFloat(total),
      });

      if (result.success && result.formToken) {
        setFormToken(result.formToken);
        setReservationId(result.reservationId ?? null);
        setCurrentStep(3);
      } else {
        setStep2Error(result.error || "Ocurrió un error al registrar tu reserva. Intenta de nuevo.");
      }
    } catch (error) {
      console.error(error);
      setStep2Error("Ocurrió un error inesperado al conectar con la pasarela.");
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar Izipay Embedded Form en el Paso 3
  useEffect(() => {
    if (currentStep === 3 && formToken) {
      const endpoint = process.env.NEXT_PUBLIC_IZIPAY_CLIENT_ENDPOINT || 'https://static.micuentaweb.pe';
      const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY || '';

      let isMounted = true;

      KRGlue.loadLibrary(endpoint, publicKey)
        .then(({ KR }) => {
          if (!isMounted) return;

          return KR.setFormConfig({
            formToken: formToken,
            'kr-language': 'es-ES',
          })
          .then(() => {
            return KR.onSubmit(paymentData => {
              if (paymentData.clientAnswer.orderStatus === 'PAID') {
                window.location.href = `/api/checkout/callback?reservationId=${reservationId}&status=SUCCESS`;
              } else {
                alert("El pago no pudo ser procesado. Intenta con otra tarjeta.");
              }
              return false;
            });
          })
          .then(() => KR.attachForm('#izipay-form-container'))
          .then(() => KR.showForm('#izipay-form-container'));
        })
        .catch(err => {
          console.error("Error cargando Izipay Form:", err);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [currentStep, formToken, reservationId]);

  return (
    <div className="w-full max-w-6xl mx-auto font-sans select-none">
      
      {/* MARCO PRINCIPAL DE LA TARJETA CHECKOUT */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden w-full">
        
        {/* HERO HEADER */}
        <header className="bg-white border-b border-gray-200/80 px-6 sm:px-12 py-6 sm:py-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Completa tu reserva</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mt-1.5 leading-relaxed">
            Revisa tu tour, completa los datos de pasajeros y confirma tu forma de pago.
          </p>
        </header>

        {/* STEPPER NAV BAR */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 px-6 sm:px-10 py-4 bg-white border-b border-gray-200/80">
          
          {/* Step 1 Pill */}
          <button 
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 1 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : currentStep > 1 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 1 ? 'bg-[#062918] text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > 1 ? <Check size={12} /> : 1}
            </span>
            <span>Reserva</span>
          </button>

          {/* Step 2 Pill */}
          <button 
            type="button"
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 2 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : currentStep > 2 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 2 ? 'bg-[#062918] text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > 2 ? <Check size={12} /> : 2}
            </span>
            <span>Pasajeros</span>
          </button>

          {/* Step 3 Pill */}
          <button 
            type="button"
            disabled={currentStep < 3}
            className={`flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${
              currentStep === 3 
                ? 'bg-[#062918]/10 border-[#062918] text-[#062918]' 
                : 'bg-white border-gray-200 text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              currentStep === 3 ? 'bg-[#062918] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </span>
            <span>Pago</span>
          </button>

        </div>

        {/* CHECKOUT BODY CONTAINER */}
        <div className="p-6 sm:p-8 bg-white">
          
          {/* ========================================================================= */}
          {/* PASO 1: RESUMEN DE RESERVAS DE TOUR (MULTI-TOUR) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Inline Alert Banner */}
              <div className="bg-[#062918]/8 border border-[#062918]/20 text-[#062918] rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 text-center">
                <Info size={16} className="shrink-0 text-[#062918]" />
                <span>
                  {remainingMinutes > 0
                    ? `Puedes seguir agregando tours al carrito, tus expediciones permanecerán reservadas durante los próximos ${remainingMinutes} minuto${remainingMinutes === 1 ? '' : 's'}.`
                    : 'El tiempo de reserva de tu carrito ha expirado. Por favor selecciona tus tours nuevamente.'}
                </span>
              </div>

              {/* LISTA DE TOURS EN EL CARRITO DE RESERVAS */}
              {activeItems.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-300 rounded-2xl space-y-4">
                  <Compass size={48} className="mx-auto text-gray-300" />
                  <h3 className="text-base font-bold text-gray-800">Tu carrito de reservas está vacío</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">Selecciona tus experiencias favoritas para proceder a la reserva y pago seguro.</p>
                  <Link 
                    href="/tours" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#062918] text-white rounded-xl text-xs font-bold hover:bg-[#0a4026] transition-colors"
                  >
                    <span>Explorar expediciones</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeItems.map((item, idx) => {
                    const itemStartDate = formatSpanishDate(item.date, 'long');
                    const itemEndDate = formatSpanishDate(item.date, 'long');

                    return (
                      <div key={item.tourSlug || idx} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs grid grid-cols-1 md:grid-cols-12 relative">
                        
                        {/* Botón de eliminar X */}
                        <button 
                          type="button"
                          onClick={() => removeItemBySlug(item.tourSlug)}
                          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-600 border border-gray-200/60 shadow-2xs transition-all cursor-pointer"
                          title="Eliminar tour del carrito"
                        >
                          <X size={16} />
                        </button>

                        {/* Imagen del Tour */}
                        <div className="md:col-span-4 min-h-[200px] md:min-h-[250px] relative overflow-hidden bg-slate-100 flex items-center justify-center border-r border-gray-100">
                          {item.image && item.image !== 'null' && item.image !== 'undefined' ? (
                            <Image src={item.image} alt={item.tourTitle} fill className="object-cover" priority unoptimized={true} />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                              <Compass size={40} className="mb-2 text-slate-400" />
                              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">INCA BOUND OPERATOR</span>
                            </div>
                          )}
                        </div>

                        {/* Detalles del Tour */}
                        <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="pb-2.5 mb-3 border-b border-gray-100 pr-6">
                              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                {item.tourTitle}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar size={15} className="text-gray-400 shrink-0" />
                                  <span>Fecha de inicio</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">{itemStartDate}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar size={15} className="text-gray-400 shrink-0" />
                                  <span>Fecha de fin</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">{itemEndDate}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Users size={15} className="text-gray-400 shrink-0" />
                                  <span>Pasajeros</span>
                                </span>
                                <span className="font-bold text-gray-900">{item.pax}</span>
                              </div>

                              <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Ticket size={15} className="text-gray-400 shrink-0" />
                                  <span>Precio por pasajero</span>
                                </span>
                                <span className="font-bold text-gray-900">US$ {item.price.toFixed(2)}</span>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <Tag size={15} className="text-gray-400 shrink-0" />
                                  <span>Tipo de servicio</span>
                                </span>
                                <span className="font-bold text-gray-900 capitalize">
                                  {item.serviceType === 'shared' ? 'Compartido' : 'Privado'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                  <DollarSign size={15} className="text-gray-400 shrink-0" />
                                  <span>Subtotal tour</span>
                                </span>
                                <span className="font-black text-lg text-[#062918]">
                                  US$ {item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Acciones por card */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer order-1 sm:order-2"
                            >
                              <CheckCircle2 size={16} />
                              <span>Reservar ahora</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-2 sm:order-1"
                            >
                              <Edit3 size={15} className="text-gray-500" />
                              <span>Editar tour</span>
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}

                  {/* Resumen Total Acumulado si hay múltiples tours: 3 items compactos en 1 sola fila con la misma altura que el botón del tour */}
                  {activeItems.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2">
                      
                      {/* Card 1: Expediciones (Compacto Inline h-[42px]) */}
                      <div className="bg-white border border-gray-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center justify-between sm:justify-center gap-2 h-[42px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                          Expediciones:
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {activeItems.length} {activeItems.length === 1 ? 'Seleccionada' : 'Seleccionadas'}
                        </span>
                      </div>

                      {/* Card 2: Total a Pagar (Compacto Inline h-[42px]) */}
                      <div className="bg-white border border-gray-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center justify-between sm:justify-center gap-2 h-[42px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                          Total a pagar:
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[#062918] whitespace-nowrap">
                          US$ {grandTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Elemento 3: Botón Reservar tours (Misma altura h-[42px] que las cards) */}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="w-full h-[42px] py-2.5 px-4 rounded-xl bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                      >
                        <span>Reservar tours</span>
                        <ArrowRight size={15} />
                      </button>

                    </div>
                  )}

                </div>
              )}

              {/* ENLACE VER MÁS TOURS */}
              <div className="pt-6 mt-8 border-t border-gray-200/80 text-center">
                <Link 
                  href="/tours" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#062918] transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Ver más tours</span>
                </Link>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: DATOS DE PASAJEROS, CONTACTO Y DATOS ADICIONALES */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="space-y-8">
              
              {/* CARD DE AVISO IMPORTANTE */}
              <div className="bg-[#fffbeb] border border-[#f59e0b] rounded-xl p-4 sm:p-4.5 flex items-start gap-3 text-amber-900 shadow-2xs">
                <AlertTriangle size={18} className="text-[#d97706] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-xs leading-relaxed">
                  <h4 className="font-bold text-amber-900 text-xs sm:text-xs">Aviso importante</h4>
                  <p className="text-amber-800/90 font-medium">
                    Los nombres y apellidos deben coincidir exactamente con los del pasaporte o DNI. Cualquier error en los datos es responsabilidad del cliente y puede generar retrasos o incluso perdida de disponibilidad.
                  </p>
                </div>
              </div>

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 1: INFORMACIÓN DE LOS PASAJEROS */}
              {/* ------------------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-[1rem] font-bold text-gray-900">
                    1. Información de los pasajeros ({maxPax})
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Encabezados de Columna */}
                  <div className="hidden sm:grid sm:grid-cols-[48px_repeat(4,1fr)] gap-3 px-1 text-xs font-semibold text-gray-500">
                    <div>Pas.</div>
                    <div>Nombres *</div>
                    <div>Apellidos *</div>
                    <div>Tipo doc *</div>
                    <div>Nro doc *</div>
                  </div>

                  {/* Filas de Pasajeros Inline */}
                  {passengers.map((paxItem, idx) => (
                    <div 
                      key={idx} 
                      className="grid grid-cols-1 sm:grid-cols-[48px_repeat(4,1fr)] gap-3 items-center p-3.5 sm:p-0 bg-gray-50/50 rounded-lg border border-gray-200/80 sm:bg-transparent sm:border-0"
                    >
                      {/* Label Pas. X */}
                      <div className="text-xs font-bold text-gray-600 flex items-center justify-between sm:justify-start">
                        <span>Pas. {idx + 1}</span>
                        <span className="sm:hidden text-[10px] text-gray-400 font-semibold">Pasajero #{idx + 1}</span>
                      </div>

                      {/* Nombres */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">Nombres *</label>
                        <input 
                          type="text"
                          required
                          value={paxItem.firstName}
                          onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                          placeholder="Nombres"
                          className={inputBaseStyle}
                        />
                      </div>

                      {/* Apellidos */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">Apellidos *</label>
                        <input 
                          type="text"
                          required
                          value={paxItem.lastName}
                          onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                          placeholder="Apellidos"
                          className={inputBaseStyle}
                        />
                      </div>

                      {/* Tipo Documento (Radix UI Select) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">Tipo doc *</label>
                        <Select 
                          value={paxItem.documentType} 
                          onValueChange={(val) => val && handlePassengerChange(idx, 'documentType', val)}
                        >
                          <SelectTrigger className="w-full h-[38px]">
                            <span>{paxItem.documentType || 'DNI'}</span>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false} side="bottom" className="w-[var(--anchor-width)] min-w-[var(--anchor-width)]">
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                            <SelectItem value="Carnet Extranjería">Carnet Extranjería</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Nro Documento */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">Nro doc *</label>
                        <input 
                          type="text"
                          required
                          value={paxItem.documentNumber}
                          onChange={(e) => handlePassengerChange(idx, 'documentNumber', e.target.value)}
                          placeholder="74288119"
                          className={`${inputBaseStyle} font-mono`}
                        />
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 2: TITULAR DE CONTACTO */}
              {/* ------------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <h3 className="text-[1rem] font-bold text-gray-900">
                    2. Titular de contacto
                  </h3>
                  
                  {passengers[0]?.firstName && (
                    <button
                      type="button"
                      onClick={copyPax1ToContact}
                      className="text-[11px] font-bold text-[#062918] hover:underline flex items-center gap-1 bg-[#062918]/10 px-2.5 py-1 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <Check size={13} />
                      {copiedPax1 ? '¡Copiado de Pasajero 1!' : 'Copiar datos de Pasajero 1'}
                    </button>
                  )}
                </div>

                {/* Grid de 4 campos en 1 sola fila en desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Nombres *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Ej. Juan"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Apellidos *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Ej. Pérez"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Correo electrónico *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className={inputBaseStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-[#1a1a1a] font-semibold mb-1">Número de teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 987 654 321"
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------------------- */}
              {/* SECCIÓN 3: DATOS ADICIONALES */}
              {/* ------------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-gray-200/80">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-[1rem] font-bold text-gray-900">
                    3. Datos adicionales
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Lugar u Hotel de recojo */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Lugar u hotel de recojo
                    </label>
                    <input 
                      type="text" 
                      value={formData.hotel}
                      onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                      placeholder="Ej. Hotel Monasterio / Plaza de Armas de Cusco"
                      className={inputBaseStyle}
                    />
                  </div>

                  {/* Idioma del servicio (Radix UI Select con Tooltip de Marca) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="block text-gray-700 font-semibold">
                        Idioma del servicio *
                      </label>
                      
                      {/* Tooltip trigger icon & popup */}
                      <div 
                        className="relative inline-flex items-center cursor-pointer group"
                        onMouseEnter={() => setShowLanguageTooltip(true)}
                        onMouseLeave={() => setShowLanguageTooltip(false)}
                        onClick={() => setShowLanguageTooltip(prev => !prev)}
                      >
                        <div className="w-4 h-4 rounded-full bg-[#062918] hover:bg-[#0a4026] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs transition-transform hover:scale-110">
                          i
                        </div>

                        {/* Tooltip Floating Popup */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex-col items-center w-64 z-30 pointer-events-none transition-all duration-150 ${showLanguageTooltip ? 'flex opacity-100 scale-100' : 'hidden group-hover:flex opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                          <div className="bg-[#062918] text-white text-[11px] font-medium leading-relaxed rounded-xl px-3.5 py-2.5 text-center shadow-xl border border-emerald-800/40">
                            Tenga en cuenta que la mayoría de nuestros tours son bilingües.
                          </div>
                          {/* Triangle arrow pointing down */}
                          <div className="w-2.5 h-2.5 bg-[#062918] rotate-45 -mt-1 rounded-xs border-r border-b border-emerald-800/40" />
                        </div>
                      </div>
                    </div>
                    <Select 
                      value={formData.language} 
                      onValueChange={(val) => val && setFormData({ ...formData, language: val })}
                    >
                      <SelectTrigger className="w-full h-[38px]">
                        <span>{formData.language || 'Español'}</span>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} side="bottom" className="w-[var(--anchor-width)] min-w-[var(--anchor-width)]">
                        <SelectItem value="Español">Español</SelectItem>
                        <SelectItem value="Inglés">Inglés</SelectItem>
                        <SelectItem value="Portugués">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Requerimientos especiales */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-1">
                      Requerimientos especiales (Opcional)
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Ej. Alimentación vegetariana, alergias, dietas o solicitudes de horario..."
                      className={`${inputBaseStyle} h-auto resize-none leading-relaxed`}
                    />
                  </div>
                </div>
              </div>

              {/* TÉRMINOS Y CONDICIONES (CON MENSAJE DE ERROR RED LABEL DEBAJO) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <input 
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked && step2Error) setStep2Error(null);
                    }}
                    className="mt-0.5 w-4 h-4 text-[#062918] rounded border-gray-300 focus:ring-[#062918] cursor-pointer"
                  />
                  <label htmlFor="terms" className="cursor-pointer leading-relaxed">
                    He leído y acepto los <Link href="/terminos" target="_blank" className="font-bold text-[#062918] underline">Términos y Condiciones</Link> y las políticas de cancelación de Inca Bound.
                  </label>
                </div>

                {/* MENSAJE DE ERROR TEXTO LIMPIO SIN CARD */}
                {step2Error && (
                  <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                    <AlertTriangle size={14} className="shrink-0 text-red-600" />
                    <span>{step2Error}</span>
                  </p>
                )}
              </div>

              {/* ACCIONES DEL PASO 2 */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Volver al Resumen
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generando Pago Seguro...
                    </>
                  ) : (
                    <>
                      Continuar al Pago Seguro
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: PASARELA DE PAGO IZIPAY EN 2 COLUMNAS (RESUMEN DE RESERVAS + PAGO) */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMNA 1: RESUMEN DE RESERVAS (SOLO TEXTO, MULTI-TOUR CON BORDER TOP Y BOTTOM) */}
                <div className="lg:col-span-6 border border-gray-200/90 rounded-2xl p-6 bg-white shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Resumen de reservas
                  </h3>

                  {/* ITEMS DE TOUR EN EL CARRITO */}
                  <div className="space-y-3">
                    {activeItems.map((item, idx) => {
                      const itemStartShort = formatSpanishDate(item.date, 'short');
                      const itemEndShort = formatSpanishDate(item.date, 'short');

                      return (
                        <div key={item.tourSlug || idx} className="py-4 border-y border-gray-200/80 bg-white space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.tourTitle}</h4>
                            <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-500 pt-1">
                            <div className="flex justify-between">
                              <span>Fecha inicio</span>
                              <span className="font-semibold text-gray-800">{itemStartShort}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fecha fin</span>
                              <span className="font-semibold text-gray-800">{itemEndShort}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pasajeros</span>
                              <span className="font-semibold text-gray-800">{item.pax}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Servicio</span>
                              <span className="font-semibold text-gray-800 capitalize">
                                {item.serviceType === 'shared' ? 'Compartido' : 'Privado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SUBTOTAL & TOTAL EN VERDE INCA BOUND */}
                  <div className="pt-2 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Subtotal ({activeItems.length} {activeItems.length === 1 ? 'tour' : 'tours'})</span>
                    <span className="font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Total a pagar</span>
                    <span className="font-black text-lg sm:text-xl text-[#062918]">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                </div>

                {/* COLUMNA 2: FORMULARIO DE PAGO IZIPAY */}
                <div className="lg:col-span-6 space-y-4">
                  
                  <div className="space-y-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-[#062918] font-bold text-sm">
                      <ShieldCheck size={18} />
                      <span>Pago 100% Seguro con Izipay</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Ingresa los datos de tu tarjeta de crédito o débito. La transacción está protegida con cifrado bancario PCI-DSS.
                    </p>
                  </div>

                  {/* CONTENEDOR DEL FORMULARIO IZIPAY */}
                  <div className="bg-gray-50 p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-2xs min-h-[320px] flex items-center justify-center">
                    <div id="izipay-form-container" className="w-full">
                      {!formToken && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                          <Loader2 size={28} className="animate-spin text-[#062918]" />
                          <span className="text-xs font-semibold">Cargando pasarela de pago segura...</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* ENLACE REGRESAR AL PASO 2 AL PIE DEL CONTENEDOR PRINCIPAL CON LÍNEA SEPARADORA */}
              <div className="pt-6 mt-8 border-t border-gray-200/80 text-center">
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a] hover:text-[#062918] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Regresar a modificar datos de pasajeros</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL INTERACTIVO DE EDITAR RESERVA - DISEÑO RESPONSIVE Y BOTONES EN GRIS */}
      {isEditModalOpen && (() => {
        const hasPrivateService = Boolean(privatePriceStr && parseFloat(privatePriceStr) > 0) || (editingTour?.serviceType === 'private');
        const durationDays = (editingTour?.tourTitle || tourTitle).toLowerCase().includes('2 días') || (editingTour?.tourTitle || tourTitle).toLowerCase().includes('2d') ? 2 : 1;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false);
            }}
          >
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-[420px] w-[95vw] shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200 ease-out border border-gray-100">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight font-heading">Editar reserva</h3>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)} 
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* 1. Tipo de Servicio (TABS SEGMENTADAS) */}
              {hasPrivateService && (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tipo de Servicio
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/90 rounded-xl border border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setModalServiceType('shared')}
                    className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalServiceType === 'shared'
                        ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200/80'
                        : 'text-gray-500 hover:text-gray-800 font-semibold'
                    }`}
                  >
                    <span className="text-xs">Compartido</span>
                    <span className="text-[11px] font-bold text-[#062918]">
                      (${parseFloat(price).toFixed(0)})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalServiceType('private')}
                    className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalServiceType === 'private'
                        ? 'bg-white text-gray-900 font-bold shadow-2xs border border-gray-200/80'
                        : 'text-gray-500 hover:text-gray-800 font-semibold'
                    }`}
                  >
                    <span className="text-xs">Privado</span>
                    <span className="text-[11px] font-bold text-[#062918]">
                      (${parseFloat(privatePriceStr || price).toFixed(0)})
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Fecha del Tour (CALENDARIO RESPONSIVE Y DÍA 2 DESTACADO) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Fecha del Tour
              </label>
              <CalendarUI 
                selectedDate={modalDate}
                durationDays={durationDays}
                onSelect={(d) => setModalDate(d)}
              />
            </div>

            {/* 3. Pasajeros (SELECTOR CON BOTONES EN GRIS IDÉNTICOS A LA REFERENCIA) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Pasajeros
              </label>
              <div className="flex items-center justify-between border border-gray-200/90 rounded-xl p-1.5 bg-white w-full shadow-2xs">
                <button
                  type="button"
                  disabled={modalPax <= 1}
                  onClick={() => setModalPax(Math.max(1, modalPax - 1))}
                  className="w-9 h-9 rounded-lg bg-gray-100/90 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Minus size={16} className="stroke-[2.5]" />
                </button>

                <span className="text-xs sm:text-sm font-bold text-gray-900 text-center px-2">
                  {modalPax} {modalPax === 1 ? 'Pasajero' : 'Pasajeros'}
                </span>

                <button
                  type="button"
                  onClick={() => setModalPax(modalPax + 1)}
                  className="w-9 h-9 rounded-lg bg-gray-100/90 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Acciones Modal */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="py-2.5 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleUpdateReservation}
                className="py-2.5 px-4 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Actualizar</span>
              </button>
            </div>

          </div>
        </div>
        );
      })()}

    </div>
  );
}
