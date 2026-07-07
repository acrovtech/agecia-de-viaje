'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { createReservationAndPaymentToken } from '../actions/reservation';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Llamar a la acción del servidor para guardar en BD (PENDING) y obtener token de Izipay
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

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      
      {/* Columna Izquierda: Formulario y Pago */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tus Datos</h2>
          
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico *</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel de Recojo</label>
                <input 
                  type="text" 
                  value={formData.hotel}
                  onChange={e => setFormData({...formData, hotel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all"
                  placeholder="Nombre de tu hotel en Cusco (Opcional)"
                  disabled={!!formToken}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Requerimientos Especiales</label>
                <textarea 
                  rows={3}
                  value={formData.requirements}
                  onChange={e => setFormData({...formData, requirements: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#062918] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Restricciones alimenticias, alergias, o detalles adicionales..."
                  disabled={!!formToken}
                />
              </div>
            </div>

            {!formToken ? (
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#062918] hover:bg-brand-teal text-white font-bold text-lg py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" /> Procesando...</>
                ) : (
                  <><CreditCard size={20} /> Ir al Pago Seguro</>
                )}
              </button>
            ) : (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 mt-8">
                <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-green-600" />
                  Conexión segura establecida
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  El formulario de pago de Izipay se inyectará aquí usando el `formToken`. 
                  Como es un ambiente de demostración, el token devuelto es simulado.
                </p>
                {/* AQUI IRÍA EL FORMULARIO INTEGRADO DE IZIPAY */}
                <div 
                  className="kr-embedded" 
                  kr-form-token={formToken}
                  style={{ minHeight: '300px', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
                >
                  <p>Widget de Izipay cargando con el token: {formToken.substring(0, 15)}...</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mt-6">
              <ShieldCheck size={16} className="text-green-600" />
              Tus datos están protegidos. Pagos procesados por Izipay de forma 100% segura.
            </div>
          </form>
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
