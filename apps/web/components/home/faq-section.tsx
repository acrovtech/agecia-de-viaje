'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const seoFaqs = [
  {
    question: '¿Cuál es la mejor época para viajar a Cusco y visitar Machu Picchu?',
    answer: 'La mejor época es durante la temporada seca, de mayo a octubre. Los días son soleados y despejados, ideales para tomar fotografías y realizar caminatas sin interrupciones por lluvias.'
  },
  {
    question: '¿Necesito prepararme para el mal de altura (Soroche) antes de viajar?',
    answer: 'Sí. Cusco se encuentra a 3,400 metros sobre el nivel del mar. Recomendamos llegar al menos 2 días antes de iniciar cualquier caminata exigente para aclimatarte.'
  },
  {
    question: "¿Necesito estar en buena forma física para el Camino Inca?",
    answer: "Sí, recomendamos tener una condición física moderada. El Camino Inca alcanza altitudes de hasta 4,200m y requiere caminar entre 6 a 8 horas diarias por terrenos irregulares."
  },
  {
    question: "¿Con cuánto tiempo de anticipación debo reservar?",
    answer: "Para el Camino Inca clásico, sugerimos reservar con al menos 6 meses de anticipación, ya que los cupos son limitados. Para otros tours, 1 o 2 meses es suficiente."
  },
  {
    question: "¿Ofrecen asistencia con la aclimatación a la altura?",
    answer: "Absolutamente. Diseñamos nuestros itinerarios para permitir una aclimatación gradual. Además, nuestros guías siempre llevan oxígeno de emergencia."
  },
  {
    question: "¿Los tours incluyen los boletos de ingreso?",
    answer: "Sí, todos nuestros paquetes completos incluyen los tickets de ingreso a los sitios arqueológicos, incluyendo Machu Picchu y los boletos de tren turístico."
  },
  {
    question: "¿Es seguro viajar a Cusco y al Valle Sagrado?",
    answer: "Cusco es una de las ciudades más seguras del Perú para los turistas. Además, al viajar con nosotros, tienes acompañamiento constante y asistencia 24/7."
  },
  {
    question: "¿Qué tipo de alimentación ofrecen en las caminatas?",
    answer: "Nuestros chefs de alta montaña preparan deliciosos platos nutritivos combinando gastronomía local e internacional, incluyendo opciones vegetarianas."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-[#F5F5F7] scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-gray-600">
            Resolvemos tus dudas principales para que tu viaje a Perú sea perfecto. Información optimizada y útil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start" itemScope itemType="https://schema.org/FAQPage">
          {seoFaqs.map((faq, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${openIndex === index ? 'border-brand-teal shadow-md' : 'border-gray-200'}`}
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none"
                onClick={() => toggleAccordion(index)}
              >
                <span className="font-semibold text-[16px] text-gray-900 pr-8" itemProp="name">
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  <ChevronDown className={`w-6 h-6 ${openIndex === index ? 'text-brand-teal' : 'text-gray-400'}`} />
                </span>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <span itemProp="text">{faq.answer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
