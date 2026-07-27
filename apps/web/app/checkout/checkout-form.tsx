'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, CreditCard, Loader2, UserCheck, Users, Copy, Check } from 'lucide-react';
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
    : 'Fecha pendiente';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Formatear resumen de pasajeros para guardar en requerimientos especiales / observaciones
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
      } else {
        alert("Ocurrió un error al procesar tu reserva.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const izipayLoaded = useRef(false);

  useEffect(() => {
    if (formToken && !izipayLoaded.current) {
      izipayLoaded.current = true;
      const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY || "YOUR_IZIPAY_PUBLIC_KEY";

      if (publicKey === "YOUR_IZIPAY_PUBLIC_KEY") {
        return;
      }

      KRGlue.loadLibrary('https://static.micuentaweb.pe', publicKey)
        .then(({ KR }) => KR.setFormConfig({
          formToken: formToken,
          'kr-language': 'es-ES',
        }))
        .then(({ KR }) => KR.onSubmit(paymentData => {
          window.location.href = `/tours?pago=exitoso&reserva=${paymentData.clientAnswer.orderDetails.orderId}`;
          return false;
        }))
        .then(({ KR }) => KR.addForm('#izipay-payment-container'))
        .then(({ KR, result }) => KR.showForm(result.formId))
        .catch(error => {
          console.error("Error cargando IziPay:", error);
        });
    }
  }, [formToken]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* Columna Izquierda: Formulario y Pago */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-200/80 shadow-xs mb-6">
          
          {!formToken ? (
            <form onSubmit={handleSubmit} className="space-y-7">
              
              {/* Bloque 1: Datos de Contacto */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#062918]" />
                  Datos de Contacto (Titular de la reserva)
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombres *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                      placeholder="Ej. Juan Carlos"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apellidos *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                      placeholder="Ej. Pérez Gómez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                      placeholder="+51 987 654 321"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos de Pasajeros */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#062918]" />
                    Datos de Pasajeros ({numPax} {numPax === 1 ? 'Persona' : 'Personas'})
                  </h2>
                </div>

                <div className="space-y-5">
                  {passengers.map((paxItem, index) => (
                    <div key={index} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-[#062918] uppercase tracking-wider bg-emerald-100/70 px-2.5 py-1 rounded-md">
                          Pasajero {index + 1}
                        </span>

                        {/* Botón de auto-rellenado para Pasajero 1 */}
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={copyContactToPax1}
                            disabled={!formData.firstName && !formData.lastName}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                              copiedPax1 
                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-[#062918] border-emerald-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {copiedPax1 ? (
                              <><Check size={14} /> ¡Datos Copiados!</>
                            ) : (
                              <><Copy size={14} /> Soy el Pasajero 1 (Copiar mis datos)</>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nombres *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.firstName}
                            onChange={e => handlePassengerChange(index, 'firstName', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none"
                            placeholder="Nombre del pasajero"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Apellidos *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.lastName}
                            onChange={e => handlePassengerChange(index, 'lastName', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none"
                            placeholder="Apellido del pasajero"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Documento</label>
                          <select
                            value={paxItem.documentType}
                            onChange={e => handlePassengerChange(index, 'documentType', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#062918] outline-none"
                          >
                            <option value="DNI">DNI (Perú)</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="Carnet de Extranjería">CE / Extranjería</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">N° de Documento *</label>
                          <input 
                            type="text"
                            required
                            value={paxItem.documentNumber}
                            onChange={e => handlePassengerChange(index, 'documentNumber', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none"
                            placeholder="N° de pasaporte o DNI"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 3: Información Adicional */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hotel en Cusco para Recojo (Opcional)</label>
                  <input 
                    type="text"
                    value={formData.hotel}
                    onChange={e => setFormData({...formData, hotel: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Hotel Costa del Sol Cusco"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Requerimientos especiales / Alergias (Opcional)</label>
                  <textarea 
                    rows={2}
                    value={formData.requirements}
                    onChange={e => setFormData({...formData, requirements: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Vegetariano, alergia al maní, etc."
                  ></textarea>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input type="checkbox" id="terms" required className="w-4 h-4 text-[#062918] rounded border-gray-300 focus:ring-[#062918]" />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  Acepto los <a href="/terminos" target="_blank" className="text-[#062918] font-bold underline">Términos y Condiciones</a> y las <a href="/privacidad" target="_blank" className="text-[#062918] font-bold underline">Políticas de Privacidad</a>.
                </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading || !!formToken}
                  className="w-full py-3.5 bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={20} /> Procesando Reserva...</>
                  ) : (
                    <>Continuar al Pago <ArrowRight size={20} /></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Reserva Generada</h3>
                <p className="text-gray-600 mt-2 text-sm">Por favor, completa tu pago de forma segura a través de Izipay para confirmar tu expedición.</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                {process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY && process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY !== "YOUR_IZIPAY_PUBLIC_KEY" ? (
                  <div className="flex justify-center">
                    <div id="izipay-payment-container"></div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-xl">
                    <CreditCard className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                    <h4 className="font-bold text-amber-900 text-base">Modo Simulado de Pago</h4>
                    <p className="text-amber-800 text-xs sm:text-sm mt-2">
                      Las credenciales reales de IziPay aún están en modo de pruebas. Haz clic abajo para simular la confirmación de tu reserva.
                    </p>
                    <button 
                      onClick={async () => {
                        if (reservationId) {
                          await fetch('/api/payments/simulate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reservationId })
                          });
                        }
                        window.location.href = `/tours?pago=simulado&reserva=${reservationId || ''}`;
                      }}
                      className="mt-5 px-6 py-2.5 bg-[#062918] text-white font-bold rounded-xl hover:bg-[#0a3d2a] transition-colors cursor-pointer text-sm"
                    >
                      Simular Pago Exitoso
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center mt-6">
            <ShieldCheck size={16} className="text-green-600 shrink-0" />
            Tus datos están protegidos. Pagos procesados por Izipay de forma 100% segura.
          </div>
        </div>
      </div>

      {/* Columna Derecha: Resumen del Pedido */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs sticky top-28">
          <h3 className="font-bold text-gray-900 mb-4 text-base">Resumen de tu Aventura</h3>
          
          <div className="pb-4 border-b border-gray-100 mb-4">
            <p className="text-[#062918] font-bold text-base md:text-lg leading-tight mb-1">{tourTitle}</p>
            <p className="text-xs text-gray-500 capitalize">{formattedDate}</p>
          </div>

          <div className="space-y-2.5 mb-5">
            <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
              <span>Tipo de servicio</span>
              <span className="font-semibold text-gray-900">{serviceType === 'shared' ? 'Compartido' : 'Privado'}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
              <span>Pasajeros</span>
              <span className="font-semibold text-gray-900">{numPax} {numPax === 1 ? 'Persona' : 'Personas'}</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-4 mb-5 border border-emerald-100/80">
            <div className="flex justify-between font-bold text-lg sm:text-xl text-gray-900">
              <span>Total a Pagar</span>
              <span className="text-[#062918]">${total} USD</span>
            </div>
          </div>

          <ul className="text-xs text-gray-500 space-y-2">
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0 mt-0.5" /> Confirmación inmediata al correo.</li>
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0 mt-0.5" /> Sin cargos ocultos por tarjetas de crédito.</li>
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0 mt-0.5" /> Soporte por WhatsApp 24/7.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
