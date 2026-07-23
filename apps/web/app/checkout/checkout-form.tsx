'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { createReservationAndPaymentToken } from '../actions/reservation';
import KRGlue from '@lyracom/embedded-form-glue';
import { useEffect, useRef } from 'react';

export function CheckoutForm() {
  const searchParams = useSearchParams();
  
  // Extraer parámetros de la URL
  const tourTitle = searchParams.get('tourTitle') || 'Tour no seleccionado';
  const tourSlug = searchParams.get('slug') || '';
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax') || '1';
  const serviceType = searchParams.get('type') || 'shared';
  const total = searchParams.get('total') || '0';

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

  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createReservationAndPaymentToken({
        tourSlug,
        tourTitle,
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        pickupHotel: formData.hotel,
        specialRequirements: formData.requirements,
        date: dateStr || new Date().toISOString(),
        pax: parseInt(pax),
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
        // Modo simulado para cuando aún no hay llaves reales
        return;
      }

      KRGlue.loadLibrary('https://static.micuentaweb.pe', publicKey)
        .then(({ KR }) => KR.setFormConfig({
          formToken: formToken,
          'kr-language': 'es-ES',
        }))
        .then(({ KR }) => KR.onSubmit(paymentData => {
          // Aquí puedes manejar la redirección a una página de éxito
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
    <div className="flex flex-col lg:flex-row gap-10">
      
      {/* Columna Izquierda: Formulario y Pago */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tus Datos</h2>
             {!formToken ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Juan Carlos"
                    disabled={!!formToken}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Pérez Gómez"
                    disabled={!!formToken}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                    placeholder="correo@ejemplo.com"
                    disabled={!!formToken}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono / WhatsApp *</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                    placeholder="+51 987 654 321"
                    disabled={!!formToken}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel en la ciudad (Opcional)</label>
                <input 
                  type="text"
                  value={formData.hotel}
                  onChange={e => setFormData({...formData, hotel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                  placeholder="Ej. Hotel Costa del Sol Cusco"
                  disabled={!!formToken}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requerimientos especiales / Alergias (Opcional)</label>
                <textarea 
                  rows={3}
                  value={formData.requirements}
                  onChange={e => setFormData({...formData, requirements: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Vegetariano, alergia al maní, etc."
                  disabled={!!formToken}
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <input type="checkbox" id="terms" required className="w-5 h-5 text-[#062918] rounded border-gray-300 focus:ring-[#062918]" />
                <label htmlFor="terms" className="text-sm text-gray-600">Acepto los <a href="#" className="text-[#062918] underline">Términos y Condiciones</a> y la Política de Privacidad.</label>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isLoading || !!formToken}
                  className="w-full py-4 bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={20} /> Procesando...</>
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
                <p className="text-gray-600 mt-2">Por favor, completa tu pago de forma segura a través de Izipay para confirmar tu expedición.</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                {process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY && process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY !== "YOUR_IZIPAY_PUBLIC_KEY" ? (
                  <div className="flex justify-center">
                    <div id="izipay-payment-container"></div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <CreditCard className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h4 className="font-bold text-yellow-800">Modo Simulado</h4>
                    <p className="text-yellow-700 text-sm mt-2">
                      Las credenciales reales de IziPay aún no están configuradas en las variables de entorno. 
                      Cuando configures <code>IZIPAY_PUBLIC_KEY</code>, aquí aparecerá el formulario real.
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
                      className="mt-6 px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
                    >
                      Simular Pago Exitoso
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mt-6">
            <ShieldCheck size={16} className="text-green-600" />
            Tus datos están protegidos. Pagos procesados por Izipay de forma 100% segura.
          </div>
        </div>
      </div>

      {/* Columna Derecha: Resumen del Pedido */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-32">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Resumen de tu Aventura</h3>
          
          <div className="pb-4 border-b border-gray-100 mb-4">
            <p className="text-[#062918] font-bold text-lg leading-tight mb-1">{tourTitle}</p>
            <p className="text-sm text-gray-500 capitalize">{formattedDate}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Tipo de servicio</span>
              <span className="font-medium text-gray-900">{serviceType === 'shared' ? 'Compartido' : 'Privado'}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Pasajeros</span>
              <span className="font-medium text-gray-900">{pax} {parseInt(pax) === 1 ? 'Persona' : 'Personas'}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between font-bold text-xl text-gray-900">
              <span>Total a Pagar</span>
              <span className="text-[#062918]">${total} USD</span>
            </div>
          </div>

          <ul className="text-xs text-gray-500 space-y-2">
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0" /> Confirmación inmediata al correo.</li>
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0" /> Sin cargos ocultos por tarjetas de crédito.</li>
            <li className="flex gap-2"><ArrowRight size={14} className="text-[#062918] shrink-0" /> Soporte por WhatsApp 24/7.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
