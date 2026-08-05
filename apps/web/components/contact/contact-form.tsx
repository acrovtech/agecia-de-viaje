'use client';

import { useState } from 'react';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset form or show success message
    }, 1500);
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
      <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight mb-6">Envíanos un Mensaje</h2>
      <p className="text-gray-600 mb-8">
        ¿Tienes dudas sobre un tour o quieres un itinerario personalizado? Escríbenos y nuestro equipo te responderá a la brevedad.
      </p>

      {isSuccess ? (
        <div className="bg-brand-teal/10 border border-brand-teal text-brand-teal p-6 rounded-xl text-center">
          <h3 className="text-xl font-bold mb-2">¡Mensaje Enviado!</h3>
          <p>Gracias por contactarnos. Te responderemos muy pronto.</p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="mt-4 text-sm font-semibold underline hover:text-brand-dark"
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-gray-700">Nombre Completo *</label>
              <input 
                type="text" 
                id="name" 
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">Correo Electrónico *</label>
              <input 
                type="email" 
                id="email" 
                required 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-semibold text-gray-700">Asunto</label>
            <input 
              type="text" 
              id="subject" 
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors"
              placeholder="Ej. Reserva Camino Inca"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-semibold text-gray-700">Mensaje *</label>
            <textarea 
              id="message" 
              required 
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors resize-none"
              placeholder="Escribe tu consulta aquí..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-brand-teal/30 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      )}
    </div>
  );
}
