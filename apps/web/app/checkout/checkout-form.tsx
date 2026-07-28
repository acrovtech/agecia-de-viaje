'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, UserCheck, Users, Copy } from 'lucide-react';
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
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const total = searchParams.get('total') || '0';

  const numPax = Math.max(1, parseInt(pax) || 1);

  const dateObj = dateStr ? new Date(dateStr) : null;
  const formattedDate = dateObj 
    ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Fecha por confirmar';

  // Control del Stepper (Paso 1: Resumen | Paso 2: Pasajeros | Paso 3: Pago)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
    /* TARJETA ÚNICA UNIFICADA CONTENEDORA (MAXIMO ANCHO) */
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm w-full max-w-6xl mx-auto space-y-8">
      
      {/* CABECERA DENTRO DE LA TARJETA */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 mb-1">Completar Reserva</h1>
        <p className="text-sm text-gray-500">Estás a un paso de tu próxima gran aventura en los Andes.</p>
      </div>

      {/* STEPPER HEADER (DENTRO DE LA TARJETA) */}
      <div className="pt-2 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#062918] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
          />

          {/* Paso 1 */}
          <div 
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className="relative z-10 flex flex-col items-center cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
              currentStep === 1 ? 'bg-[#062918] text-white ring-4 ring-[#062918]/20' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
            }`}>
              {currentStep > 1 ? <Check size={18} /> : 1}
            </div>
            <span className={`text-xs font-bold mt-2 transition-colors ${currentStep === 1 ? 'text-gray-900' : 'text-gray-500'}`}>
              Resumen
            </span>
          </div>

          {/* Paso 2 */}
          <div 
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className="relative z-10 flex flex-col items-center cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
              currentStep === 2 ? 'bg-[#062918] text-white ring-4 ring-[#062918]/20' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
            }`}>
              {currentStep > 2 ? <Check size={18} /> : 2}
            </div>
            <span className={`text-xs font-bold mt-2 transition-colors ${currentStep === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
              Pasajeros
            </span>
          </div>

          {/* Paso 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
              currentStep === 3 ? 'bg-[#062918] text-white ring-4 ring-[#062918]/20' : 'bg-white text-gray-400 border-2 border-gray-200'
            }`}>
              3
            </div>
            <span className={`text-xs font-bold mt-2 transition-colors ${currentStep === 3 ? 'text-gray-900' : 'text-gray-500'}`}>
              Pago Seguro
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: RESUMEN DE RESERVA DE TOUR */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 pt-2">
          <div>
            <h2 className="text-xl font-bold font-heading text-gray-900">1. Resumen de tu Expedición</h2>
            <p className="text-gray-500 text-sm mt-0.5">Verifica la fecha y cantidad de viajeros antes de completar tus datos.</p>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#062918]/10 text-[#062918] font-bold text-xs rounded-lg uppercase tracking-wider">
                {serviceType === 'shared' ? 'Servicio Compartido' : 'Servicio Privado'}
              </span>
              <span className="text-xs text-gray-500 font-medium">Inca Bound Tour Operator</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900">{tourTitle}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-gray-700">
              <div className="bg-white p-4 rounded-xl border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Fecha de Salida</span>
                <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Viajeros Totales</span>
                <span className="font-semibold text-gray-900">{numPax} {numPax === 1 ? 'Persona' : 'Personas'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Total a pagar</span>
              <span className="text-2xl text-[#062918]">${total} USD</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              Continuar a Datos de Pasajeros
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: DATOS DEL TITULAR Y PASAJEROS */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <form onSubmit={handleProceedToStep3} className="space-y-8 pt-2">
          <div>
            <h2 className="text-xl font-bold font-heading text-gray-900">2. Información del Titular y Pasajeros</h2>
            <p className="text-gray-500 text-sm mt-0.5">Completa los nombres nominativos para el registro de tu expedición.</p>
          </div>

          {step2Error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {step2Error}
            </div>
          )}

          {/* DATOS DEL TITULAR DE CONTACTO */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UserCheck size={18} className="text-[#062918]" />
              Datos del Titular (Quien realiza la reserva)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ej. Juan Carlos"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#062918] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ej. Pérez Gómez"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#062918] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan.perez@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#062918] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+51 987 654 321"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#062918] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Hotel de Recojo en Cusco (Opcional)</label>
              <input
                type="text"
                value={formData.hotel}
                onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                placeholder="Ej. Hotel Plaza de Armas Cusco"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#062918] text-sm"
              />
            </div>
          </div>

          {/* LISTADO DE PASAJEROS CON AUTO-FILL */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-[#062918]" />
                  Detalle de Pasajeros ({numPax})
                </h3>
                <p className="text-xs text-gray-500">Documentación exigida por controles en los Andes.</p>
              </div>

              <button
                type="button"
                onClick={copyContactToPax1}
                disabled={!formData.firstName || !formData.lastName}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#062918] text-xs font-bold rounded-xl border border-emerald-200/80 transition-colors disabled:opacity-50"
              >
                {copiedPax1 ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    ¡Datos copiados al Pasajero 1!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    ✨ Soy el Pasajero 1 (Copiar mis datos)
                  </>
                )}
              </button>
            </div>

            {passengers.map((paxItem, idx) => (
              <div key={idx} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pasajero {idx + 1} {idx === 0 && '(Principal)'}
                  </span>
                  {idx === 0 && (
                    <span className="text-[11px] font-semibold bg-[#062918]/10 text-[#062918] px-2.5 py-0.5 rounded-full">
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
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#062918] text-xs md:text-sm"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#062918] text-xs md:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Documento</label>
                    <select
                      value={paxItem.documentType}
                      onChange={(e) => handlePassengerChange(idx, 'documentType', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#062918] text-xs md:text-sm"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#062918] text-xs md:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Regresar al Resumen
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3.5 bg-[#062918] hover:bg-[#0a4026] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando Reserva...
                </>
              ) : (
                <>
                  Continuar al Pago Seguro
                  <ArrowRight size={18} />
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
        <div className="space-y-6 pt-2">
          <div className="text-center">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase tracking-wider inline-block mb-2">
              Reserva Registrada
            </span>
            <h2 className="text-xl font-bold font-heading text-gray-900">3. Completa tu Pago Seguro</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Ingresa los datos de tu tarjeta en la pasarela cifrada de **Izipay (PCI-DSS)**.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-600 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span>Tour:</span>
              <span className="font-bold text-gray-900">{tourTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>Titular:</span>
              <span className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total a pagar:</span>
              <span className="font-bold text-emerald-700 text-sm">${total} USD</span>
            </div>
          </div>

          {/* Formulario embebido Izipay */}
          <div className="py-4">
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
  );
}
