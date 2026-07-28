'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

const testimonials = [
  {
    name: "Paola G",
    date: "Hace 1 año",
    title: "¡Recomendadísimo!",
    text: "¡Una experiencia totalmente hermosa! Vale la pena el cansancio para llegar a ver ese paisaje. Mi guía fue Jeferson y 10/10 excelente actitud, buena vibra, pendiente de todos y excelente fotógrafo.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/de/e7/default-avatar-2020-37.jpg"
  },
  {
    name: "Jose Daniel S",
    date: "Hace 2 años",
    title: "Excelente experiencia en Humantay",
    text: "Excelente experiencia, hicimos el tour al Humantay, nos correspondió con el guía Miguel y nos dio un acompañamiento excelente. Además el tour incluía desayuno y almuerzo en un lugar lindo y con bastantes opciones.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/ed/00/default-avatar-2020-4.jpg"
  },
  {
    name: "César Fernando P",
    date: "Hace 2 años",
    title: "Tour Montaña de 7 Colores",
    text: "Excelente agencia de turismo. El itinerario al 100%, la visita a 7 colores cumplió la expectativa. El clima fue genial y el guía Miguel excepcional, colaborador y presto en todo momento.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/eb/a3/default-avatar-2020-38.jpg"
  },
  {
    name: "Cesar R",
    date: "Hace 2 años",
    title: "Excelente trip a la laguna",
    text: "Todo estuvo perfecto, el transporte estuvo en tiempo, el desayuno estuvo bien y el guía Miguel estuvo 10/10!! Lo súper recomiendo, nos tuvo paciencia y nos explicó súper bien todo.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/f0/9f/default-avatar-2020-16.jpg"
  },
  {
    name: "Carla E",
    date: "Hace 2 años",
    title: "Genial 7 Colores y Humantay",
    text: "Nosotras hicimos dos excursiones: Montaña de colores y Laguna Humantay. Nuestro guía en las dos fue Miguel, atento con la altitud y preocupándose por nuestro estado de salud en todo momento.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/e3/1f/default-avatar-2020-46.jpg"
  },
  {
    name: "Yara Barbosa",
    date: "Hace 2 años",
    title: "A melhor experiência em Cusco",
    text: "Super recomendo e o diferencial do passeio foi a cortesia, educação e disponibilidade do guia além de todo seu conhecimento profissional e carinho com o grupo.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/eb/a3/default-avatar-2020-38.jpg"
  }
];

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Avanzar exactamente 1 tarjeta a la izquierda
  const scrollPrev = () => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 340;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  // Avanzar exactamente 1 tarjeta a la derecha
  const scrollNext = () => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 340;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="section-title">
            Nuestros viajeros <span className="text-[#062918]">lo confirman</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Historias reales de personas que vivieron la magia del Perú con Inca Bound. Más de 1000 opiniones de 5 estrellas en TripAdvisor.
          </p>
        </div>

        {/* Contenedor relativo con grupo de Hover para las Flechas Flotantes */}
        <div className="relative group max-w-[1400px] mx-auto">
          
          {/* Flecha Flotante Izquierda (Aparece en Hover) */}
          <button 
            onClick={scrollPrev}
            aria-label="Testimonio anterior"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white hover:border-[#062918] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Lista Flotante de 1 en 1 */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto scroll-smooth hide-scrollbar gap-6 py-2 snap-x snap-mandatory"
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)] snap-start shrink-0"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-200 h-full flex flex-col justify-between shadow-2xs hover:border-gray-300 transition-colors">
                  <div>
                    {/* Top Row: Avatar, Name & Date */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                          <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-[15px] leading-tight">{testimonial.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{testimonial.date}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#00aa6c] flex items-center justify-center text-white shrink-0">
                        <svg viewBox="0 0 576 512" fill="currentColor" width="12" height="12"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
                      </div>
                    </div>

                    {/* TripAdvisor Rating Bubbles */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex items-center gap-[3px]">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border-[1.5px] border-[#00aa6c] flex items-center justify-center p-[2px] shrink-0">
                            <div className="w-full h-full bg-[#00aa6c] rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Title & Body */}
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{testimonial.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                      {testimonial.text}
                    </p>
                  </div>

                  <a 
                    href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 text-[#008060] hover:text-[#062918] text-xs font-bold transition-colors inline-block"
                  >
                    Ver en TripAdvisor →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Flecha Flotante Derecha (Aparece en Hover) */}
          <button 
            onClick={scrollNext}
            aria-label="Testimonio siguiente"
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white hover:border-[#062918] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
}
