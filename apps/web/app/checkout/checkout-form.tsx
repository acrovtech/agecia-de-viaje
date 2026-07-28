'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, UserCheck, Users, 
  Info, Compass, Calendar, Ticket, Tag, DollarSign, Edit3, X, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import { createReservationAndPaymentToken } from '../actions/reservation';
import KRGlue from '@lyracom/embedded-form-glue';

type Passenger = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
};

export function CheckoutForm() {
  const searchParams = useSearchParams();
  
  // Extraer parámetros de la URL
  const tourTitle = searchParams.get('tourTitle') || 'Tour Inca Bound';
  const tourSlug = searchParams.get('slug') || '';
  const tourImage = searchParams.get('image');
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const price = searchParams.get('price') || '0';
  const total = searchParams.get('total') || '0';

  const numPax = Math.max(1, parseInt(pax) || 1);

  // Formato de fechas en español sin TitleCase exagerado
  const dateObj = dateStr ? new Date(dateStr) : null;
  const formattedStartDate = dateObj 
    ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Fecha por confirmar';

  // Fecha de fin (para tours de 1D / 1/2 Día la fecha de fin es el mismo día)
  const formattedEndDate = formattedStartDate;

  // Control del Stepper (Paso 1: Reserva | Paso 2: Pasajeros | Paso 3: Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hotel: '',
    requirements: ''
  });

  // Estado de pasajeros
  const [passengers, setPassengers] = useState<Passenger[]>(() => 
    Array.from({ length: numPax }, () => ({
      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
    }))
  );

  const [copiedPax1, setCopiedPax1] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Copiar datos del titular de contacto al Pasajero 1
  const copyContactToPax1 = (e: React.MouseEvent) => {
    e.preventDefault();
    setPassengers(prev => {
      const next = [...prev];
      if (next[0]) {
        next[0] = {
          ...next[0],
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
      }
      return next;
    });
    setCopiedPax1(true);
    setTimeout(() => setCopiedPax1(false), 2500);
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
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setStep2Error('Por favor completa todos los campos requeridos del titular de contacto.');
      return;
    }

    if (!termsAccepted) {
      setStep2Error('Debes aceptar los términos para continuar con la reserva.');
      return;
    }

    setStep2Error(null);
    setIsLoading(true);

    try {
      const paxSummary = passengers.map((p, idx) => 
        `Pax ${idx + 1}: ${p.firstName} ${p.lastName} (${p.documentType}: ${p.documentNumber || 'N/A'})`
      ).join(' | ');

      const fullRequirements = formData.requirements 
        ? `${formData.requirements} [Pasajeros: ${paxSummary}]`
        : `[Pasajeros: ${paxSummary}]`;

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
        setReservationId(result.reservationId);
        setCurrentStep(3);
      } else {
        setStep2Error("Ocurrió un error al registrar tu reserva. Intenta de nuevo.");
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
        <header className="bg-white border-b border-gray-200/80 px-6 sm:px-12 pt-8 pb-6 text-center">
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
          {/* PASO 1: RESUMEN DE RESERVA DE TOUR */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Inline Alert Banner */}
              <div className="bg-[#062918]/8 border border-[#062918]/20 text-[#062918] rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 text-center">
                <Info size={16} className="shrink-0 text-[#062918]" />
                <span>Puedes seguir agregando tours al carrito, estos permanecerán durante 60 minutos.</span>
              </div>

              {/* CARD DE RESERVA EN 2 COLUMNAS */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs grid grid-cols-1 md:grid-cols-12">
                
                {/* Columna Izquierda: Imagen del Tour o Fallback Gris Claro */}
                <div className="md:col-span-4 min-h-[220px] md:min-h-[280px] relative overflow-hidden bg-slate-100 flex items-center justify-center border-r border-gray-100">
                  {tourImage && tourImage !== 'null' && tourImage !== 'undefined' ? (
                    <Image src={tourImage} alt={tourTitle} fill className="object-cover" priority unoptimized={true} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                      <Compass size={44} className="mb-2 text-slate-400" />
                      <span className="text-[11px] font-bold tracking-widest uppercase text-slate-600">INCA BOUND OPERATOR</span>
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Información en 2 Columnas + Separadores de Título y Botones */}
                <div className="md:col-span-8 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  
                  <div>
                    {/* Título & Botón de eliminar (Con línea separadora inferior pb-3 mb-3 border-b) */}
                    <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-gray-100">
                      <h3 className="text-[1.25rem] leading-snug font-bold text-gray-900 tracking-tight">
                        {tourTitle}
                      </h3>
                      <button 
                        type="button"
                        onClick={() => window.location.href = tourSlug ? `/tours/${tourSlug}` : '/tours'}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Eliminar o cambiar tour"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Grilla en 2 Columnas idéntica al Plugin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs sm:text-sm">
                      
                      {/* Fila 1 */}
                      <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Calendar size={15} className="text-gray-400 shrink-0" />
                          <span>Fecha de inicio</span>
                        </span>
                        <span className="font-bold text-gray-900 capitalize">{formattedStartDate}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Calendar size={15} className="text-gray-400 shrink-0" />
                          <span>Fecha de fin</span>
                        </span>
                        <span className="font-bold text-gray-900 capitalize">{formattedEndDate}</span>
                      </div>

                      {/* Fila 2 */}
                      <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Users size={15} className="text-gray-400 shrink-0" />
                          <span>Pasajeros</span>
                        </span>
                        <span className="font-bold text-gray-900">{numPax}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Ticket size={15} className="text-gray-400 shrink-0" />
                          <span>Precio por pasajero</span>
                        </span>
                        <span className="font-bold text-gray-900">US$ {parseFloat(price).toFixed(2)}</span>
                      </div>

                      {/* Fila 3 */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Tag size={15} className="text-gray-400 shrink-0" />
                          <span>Tipo de servicio</span>
                        </span>
                        <span className="font-bold text-gray-900 capitalize">
                          {serviceType === 'shared' ? 'Compartido' : 'Privado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <DollarSign size={15} className="text-gray-400 shrink-0" />
                          <span>Precio total</span>
                        </span>
                        <span className="font-black text-lg text-[#062918]">
                          US$ {parseFloat(total).toFixed(2)}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* BOTONES DENTRO DE LA CARD (Con línea separadora superior pt-4 mt-3 border-t) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-3 border-t border-gray-100">
                    
                    <button
                      type="button"
                      onClick={() => window.location.href = tourSlug ? `/tours/${tourSlug}` : '/tours'}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={15} className="text-gray-500" />
                      <span>Editar tour</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 px-5 rounded-xl bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Reservar ahora</span>
                    </button>

                  </div>

                </div>

              </div>

              {/* ENLACE VER MÁS TOURS DENTRO DEL CONTENEDOR DE LA CARD CON LÍNEA SEPARADORA */}
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
          {/* PASO 2: DATOS DEL TITULAR Y PASAJEROS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="space-y-6">
              
              {/* CARD DE AVISO IMPORTANTE (ALERT AMBER BORDER & BACKGROUND) */}
              <div className="bg-[#fffbeb] border border-[#f59e0b] rounded-xl p-4 sm:p-4.5 flex items-start gap-3 text-amber-900 shadow-2xs">
                <AlertTriangle size={18} className="text-[#d97706] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-xs leading-relaxed">
                  <h4 className="font-bold text-amber-900 text-xs sm:text-xs">Aviso importante</h4>
                  <p className="text-amber-800/90 font-medium">
                    Los nombres y apellidos deben coincidir exactamente con los del pasaporte o DNI. Cualquier error en los datos es responsabilidad del cliente y puede generar retrasos o incluso perdida de disponibilidad.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Completa la información requerida</h2>
                <p className="text-xs text-gray-500 mt-1">Registra al titular de la reserva y a cada uno de los viajeros nominativos.</p>
              </div>

              {step2Error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {step2Error}
                </div>
              )}

              {/* FORMULARIO TITULAR DE CONTACTO */}
              <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={16} className="text-[#062918]" />
                  Titular de Contacto (Quien realiza la reserva)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Nombres *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Ej. Juan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 987 654 321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-1">Hotel o Lugar de Recojo en Cusco</label>
                    <input 
                      type="text" 
                      value={formData.hotel}
                      onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                      placeholder="Ej. Hotel Monasterio / Plaza de Armas"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* LISTA NOMINATIVA DE PASAJEROS */}
              <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-[#062918]" />
                    Lista Nominativa de Pasajeros ({numPax})
                  </p>
                  
                  {formData.firstName && (
                    <button
                      type="button"
                      onClick={copyContactToPax1}
                      className="text-[11px] font-bold text-[#062918] hover:underline flex items-center gap-1 bg-[#062918]/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Check size={13} />
                      {copiedPax1 ? '¡Copiado a Pasajero 1!' : 'Copiar titular a Pasajero 1'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {passengers.map((paxItem, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#062918]">Pasajero #{idx + 1}</span>
                        <span className="text-[11px] text-gray-400">Dato requerido para boleto/ticket</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-gray-600 mb-1 font-medium">Nombres *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.firstName}
                            onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                            placeholder="Nombre"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-[#062918] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1 font-medium">Apellidos *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.lastName}
                            onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                            placeholder="Apellido"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-1 focus:ring-[#062918] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1 font-medium">Tipo Documento</label>
                          <select
                            value={paxItem.documentType}
                            onChange={(e) => handlePassengerChange(idx, 'documentType', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#062918] outline-none"
                          >
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="Carnet Extranjería">Carnet Extranjería</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1 font-medium">N° Documento *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.documentNumber}
                            onChange={(e) => handlePassengerChange(idx, 'documentNumber', e.target.value)}
                            placeholder="12345678"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono focus:ring-1 focus:ring-[#062918] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REQUERIMIENTOS ESPECIALES */}
              <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/80 space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Requerimientos Especiales o Dietas
                </label>
                <textarea 
                  rows={2}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Ej. Alimentación vegetariana, alergias, o solicitudes de horario..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs focus:ring-2 focus:ring-[#062918] focus:border-[#062918] outline-none leading-relaxed resize-none"
                />
              </div>

              {/* TÉRMINOS Y CONDICIONES */}
              <div className="flex items-start gap-3 p-4 bg-gray-50/90 rounded-xl border border-gray-200 text-xs">
                <input 
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#062918] rounded border-gray-300 focus:ring-[#062918]"
                />
                <label htmlFor="terms" className="text-gray-600 leading-relaxed">
                  He leído y acepto los <Link href="/terminos" target="_blank" className="font-bold text-[#062918] underline">Términos y Condiciones</Link> y las políticas de cancelación de Inca Bound.
                </label>
              </div>

              {/* ACCIONES DEL PASO 2 */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Volver al Resumen
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
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
          {/* PASO 3: PASARELA DE PAGO IZIPAY */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Pago 100% Seguro con Izipay</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Ingresa los datos de tu tarjeta de crédito o débito a continuación. La transacción está encriptada con certificación PCI-DSS.
                </p>
              </div>

              {/* CONTENEDOR DEL FORMULARIO IZIPAY */}
              <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-200/90 shadow-2xs min-h-[320px] flex items-center justify-center">
                <div id="izipay-form-container" className="w-full">
                  {!formToken && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                      <Loader2 size={28} className="animate-spin text-[#062918]" />
                      <span className="text-xs font-semibold">Cargando pasarela de pago segura...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Regresar a modificar datos de pasajeros
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
