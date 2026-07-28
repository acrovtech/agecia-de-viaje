'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, UserCheck, Users, Copy, Info, Compass } from 'lucide-react';
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
  const tourTitle = searchParams.get('tourTitle') || 'Tour no seleccionado';
  const tourSlug = searchParams.get('slug') || '';
  const tourImage = searchParams.get('image');
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const price = searchParams.get('price') || '0';
  const total = searchParams.get('total') || '0';

  const numPax = Math.max(1, parseInt(pax) || 1);

  // Formato de fecha estándar en español sin TitleCase exagerado
  const dateObj = dateStr ? new Date(dateStr) : null;
  const formattedDate = dateObj 
    ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Fecha por confirmar';

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
      let isMounted = true;
      const endpoint = process.env.NEXT_PUBLIC_IZIPAY_ENDPOINT || "https://static.micuentaweb.pe";
      const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY || "81525946:publickey_DEMO5946c5B5e56e";

      KRGlue.loadLibrary(endpoint, publicKey)
        .then((res) => {
          if (!isMounted || !res) return;
          const { KR } = res;
          return KR.setFormConfig({
            formToken: formToken,
            "kr-language": "es-ES"
          })
          .then(() => {
            return KR.onSubmit((paymentData: any) => {
              fetch('/api/checkout/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
              })
              .then(r => r.json())
              .then(data => {
                if (data.success) {
                  window.location.href = data.redirectUrl;
                } else {
                  alert("Error validando el pago: " + data.message);
                }
              });
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
  }, [currentStep, formToken]);

  return (
    /* MARCO PRINCIPAL DE LA TARJETA (acrov-checkout-frame - Max Width 1280px) */
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden w-full max-w-7xl mx-auto font-sans">
      
      {/* HERO HEADER (acrov-checkout-hero - Tipografía limpia sin gritar) */}
      <header className="bg-white border-b border-gray-200/80 px-6 sm:px-12 pt-8 pb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Completa tu reserva</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto mt-1.5 leading-relaxed">
          Revisa tu tour, completa los datos de pasajeros y confirma tu forma de pago.
        </p>
      </header>

      {/* STEPPER NAV BAR (acrov-checkout-stepper) */}
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
            
            {/* Inline Alert Banner (acrov-checkout-inline-alert - Texto limpio) */}
            <div className="bg-[#062918]/8 border border-[#062918]/20 text-[#062918] rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 text-center">
              <Info size={16} className="shrink-0 text-[#062918]" />
              <span>Puedes seguir agregando tours al carrito, estos permanecerán durante 60 minutos.</span>
            </div>

            {/* Cart Card Layout (acrov-checkout-cart-card) */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs grid grid-cols-1 md:grid-cols-12">
              
              {/* Columna Izquierda: Imagen del Tour o Fallback Oficial del Plugin */}
              <div className="md:col-span-4 min-h-[240px] md:min-h-[280px] relative overflow-hidden bg-gradient-to-br from-[#062918] via-[#0c4028] to-slate-900 flex items-center justify-center">
                {tourImage && tourImage !== 'null' && tourImage !== 'undefined' ? (
                  <Image src={tourImage} alt={tourTitle} fill className="object-cover" priority unoptimized={true} />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/70 p-6 text-center">
                    <Compass size={44} className="mb-2 text-white/50 animate-pulse" />
                    <span className="text-xs font-bold tracking-widest uppercase text-white/90">INCA BOUND EXPEDITIONS</span>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Detalles & Precios con Tamaños Homogéneos */}
              <div className="md:col-span-8 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="px-3 py-1 bg-[#062918]/10 text-[#062918] text-xs font-bold rounded-full uppercase tracking-wider">
                      {serviceType === 'shared' ? 'Servicio Compartido' : 'Servicio Privado'}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inca Bound</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    {tourTitle}
                  </h3>

                  {/* Filas Punteadas (Dashed Rows con font-size uniforme) */}
                  <div className="border-y border-dashed border-gray-200 py-3 space-y-2.5 text-xs sm:text-sm">
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-500">Fecha de salida:</span>
                      <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-500">Pasajeros:</span>
                      <span className="font-semibold text-gray-900">{numPax} {numPax === 1 ? 'Persona' : 'Personas'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-500">Precio por pasajero:</span>
                      <span className="font-semibold text-gray-900">${price} USD</span>
                    </div>

                  </div>
                </div>

                {/* Fila de Total dentro de la tarjeta */}
                <div className="pt-3 flex items-center justify-between border-t border-gray-100">
                  <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Total</span>
                  <span className="text-2xl font-bold text-[#062918]">${total} USD</span>
                </div>

              </div>

            </div>

            {/* Layout de Footer del Plugin */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="w-full sm:w-auto flex-1 bg-[#062918]/8 border border-[#062918]/20 px-5 py-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-gray-600">Resumen Total</span>
                <span className="text-xl font-bold text-[#062918]">${total} USD</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Continuar a Datos de Pasajeros
                <ArrowRight size={16} />
              </button>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: DATOS DEL TITULAR Y PASAJEROS */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToStep3} className="space-y-6">
            
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 outline-none transition focus:border-[#062918] focus:ring-2 focus:ring-[#062918]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej. Pérez Gómez"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 outline-none transition focus:border-[#062918] focus:ring-2 focus:ring-[#062918]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan.perez@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 outline-none transition focus:border-[#062918] focus:ring-2 focus:ring-[#062918]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+51 987 654 321"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 outline-none transition focus:border-[#062918] focus:ring-2 focus:ring-[#062918]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hotel de Recojo en Cusco (Opcional)</label>
                <input
                  type="text"
                  value={formData.hotel}
                  onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                  placeholder="Ej. Hotel Plaza de Armas Cusco"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 outline-none transition focus:border-[#062918] focus:ring-2 focus:ring-[#062918]/20"
                />
              </div>
            </div>

            {/* DETALLE DE PASAJEROS */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-[#062918]" />
                    Detalle de Pasajeros ({numPax})
                  </p>
                  <p className="text-xs text-gray-400">Documentación exigida por controles en los Andes.</p>
                </div>

                <button
                  type="button"
                  onClick={copyContactToPax1}
                  disabled={!formData.firstName || !formData.lastName}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#062918] text-xs font-bold rounded-xl border border-emerald-200 transition-colors disabled:opacity-50"
                >
                  {copiedPax1 ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      ¡Copiado a Pasajero 1!
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      ✨ Soy el Pasajero 1 (Copiar mis datos)
                    </>
                  )}
                </button>
              </div>

              {passengers.map((paxItem, idx) => (
                <div key={idx} className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Pasajero {idx + 1} {idx === 0 && '(Principal)'}
                    </span>
                    {idx === 0 && (
                      <span className="text-[11px] font-bold bg-[#062918]/10 text-[#062918] px-2.5 py-0.5 rounded-md">
                        Titular
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={paxItem.firstName}
                        onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                        placeholder="Nombres del viajero"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm outline-none focus:border-[#062918]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={paxItem.lastName}
                        onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                        placeholder="Apellidos del viajero"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm outline-none focus:border-[#062918]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Documento</label>
                      <select
                        value={paxItem.documentType}
                        onChange={(e) => handlePassengerChange(idx, 'documentType', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm outline-none focus:border-[#062918]"
                      >
                        <option value="DNI">DNI</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="Carnet Extranjería">Carnet Extranjería</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número de Documento</label>
                      <input
                        type="text"
                        value={paxItem.documentNumber}
                        onChange={(e) => handlePassengerChange(idx, 'documentNumber', e.target.value)}
                        placeholder="Ej. 72839401"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm outline-none focus:border-[#062918]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CHECKBOX DE TÉRMINOS */}
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#062918]"
              />
              <span className="text-xs leading-5 text-gray-600 font-medium">
                Acepto los términos y condiciones de servicio para continuar con la reserva.
              </span>
            </label>

            {/* ACCIONES DE NAVEGACIÓN */}
            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 uppercase tracking-wider"
              >
                <ArrowLeft size={16} />
                Regresar al Resumen
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Procesando...
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
        {/* PASO 3: PAGO SEGURO CON IZIPAY */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 text-center">
            
            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase tracking-wider inline-block mb-2">
                Reserva Registrada
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Completa tu Pago Seguro</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Ingresa los datos de tu tarjeta en la pasarela cifrada de **Izipay (PCI-DSS)**.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2 text-gray-600 max-w-md mx-auto">
              <div className="flex justify-between">
                <span>Tour:</span>
                <span className="font-bold text-gray-900">{tourTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Titular:</span>
                <span className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                <span className="font-bold">Total a pagar:</span>
                <span className="font-bold text-[#062918] text-base">${total} USD</span>
              </div>
            </div>

            {/* Formulario embebido Izipay */}
            <div className="py-2">
              <div id="izipay-form-container" className="flex justify-center min-h-[280px]" />
            </div>

            <div className="flex justify-start pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 underline"
              >
                ← Modificar datos de pasajeros
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
