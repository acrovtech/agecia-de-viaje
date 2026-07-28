'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function LatestArticles() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultArticles = [
    {
      id: '1',
      title: 'Guía Completa para Visitar la Laguna Humantay',
      slug: 'guia-laguna-humantay',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-inca-bound.webp',
      category: 'Trekking'
    },
    {
      id: '2',
      title: 'Consejos para Aclimatarte al Mal de Altura (Soroche) en Cusco',
      slug: 'consejos-aclimatacion-cusco',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/viajes-seguros-peru-inca-bound.webp',
      category: 'Consejos'
    },
    {
      id: '3',
      title: 'Montaña de 7 Colores (Vinicunca): Todo lo que Debes Saber',
      slug: 'montana-7-colores-vinicunca',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/experiencia-viajes-inca-bound.webp',
      category: 'Aventura'
    },
    {
      id: '4',
      title: 'Qué Llevar en tu Mochila de Trekking para el Valle Sagrado',
      slug: 'que-llevar-valle-sagrado',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/mascara.webp',
      category: 'Equipamiento'
    },
    {
      id: '5',
      title: 'Machu Picchu: Diferencias entre los Circuitos de Ingreso',
      slug: 'circuitos-machu-picchu',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours-peru-inca-bound.webp',
      category: 'Cultura'
    },
    {
      id: '6',
      title: 'Gastronomía Andina: Platos Típicos que Debes Probar en Cusco',
      slug: 'gastronomia-andina-cusco',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-cusco-contacto.webp',
      category: 'Gastronomía'
    }
  ];

  // Desplazar exactamente 1 tarjeta a la izquierda
  const scrollPrev = () => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 340;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  // Desplazar exactamente 1 tarjeta a la derecha
  const scrollNext = () => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 340;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-[#F9FAFA] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Encabezado Centrado */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="section-title">Últimos Artículos</h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Descubre guías, tips y relatos de viajes para preparar tu próxima gran aventura en los Andes.
          </p>
        </div>

        {/* Contenedor relativo con grupo de Hover para las Flechas Flotantes */}
        <div className="relative group max-w-[1400px] mx-auto">
          
          {/* Flecha Flotante Izquierda (Aparece en Hover) */}
          <button 
            onClick={scrollPrev}
            aria-label="Artículo anterior"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white hover:border-[#062918] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Carrusel Desplazable de 1 en 1 */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto scroll-smooth hide-scrollbar gap-6 py-2 snap-x snap-mandatory"
          >
            {defaultArticles.map((article) => (
              <div
                key={article.id}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)] snap-start shrink-0"
              >
                <Link 
                  href={`/blog/${article.slug}`} 
                  className="relative group/card cursor-pointer overflow-hidden aspect-[4/3] bg-black block rounded-2xl shadow-xs hover:shadow-xl transition-all"
                >
                  <Image 
                    src={article.bannerImage} 
                    alt={article.title} 
                    fill 
                    unoptimized={true}
                    className="object-cover opacity-75 group-hover/card:opacity-40 transition-all duration-700 group-hover/card:scale-105 z-0"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />

                  <div className="absolute inset-0 flex flex-col justify-between p-6 z-20">
                    <span className="self-start px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30 uppercase tracking-wider">
                      {article.category}
                    </span>
                    <h3 className="text-white text-lg font-bold tracking-wide font-heading drop-shadow-md transform group-hover/card:-translate-y-1 transition-transform duration-500 leading-snug">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Flecha Flotante Derecha (Aparece en Hover) */}
          <button 
            onClick={scrollNext}
            aria-label="Artículo siguiente"
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
