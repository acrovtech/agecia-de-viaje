'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function LatestArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/tours')
      .then(res => res.json())
      .then(() => {
        // Cargar artículos del blog desde la API o fallbacks
        fetch('/api/seed')
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  // Artículos predeterminados de alta calidad si la BD está inicializándose
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

  const items = articles.length > 0 ? articles.slice(0, 6) : defaultArticles;

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-24 bg-[#F9FAFA] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Header con Controles del Carrusel */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="section-title text-left">Últimos Artículos</h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              Descubre guías, tips y relatos de viajes para preparar tu próxima gran aventura en los Andes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={prevSlide}
              aria-label="Artículo anterior"
              className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-[#062918] hover:text-white hover:border-[#062918] text-gray-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            
            <div className="text-xs font-bold text-gray-400 px-2">
              <span className="text-gray-900">{currentIndex + 1}</span> / {items.length}
            </div>

            <button 
              onClick={nextSlide}
              aria-label="Artículo siguiente"
              className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-[#062918] hover:text-white hover:border-[#062918] text-gray-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Carrusel Desplazable de 1 en 1 */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: `translateX(-${currentIndex * (100 / 1)}%)` }}
          >
            {items.map((article) => (
              <div
                key={article.id}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)] shrink-0"
              >
                <Link 
                  href={`/blog/${article.slug}`} 
                  className="relative group cursor-pointer overflow-hidden aspect-[4/3] bg-black block rounded-2xl shadow-sm hover:shadow-xl transition-all"
                >
                  <Image 
                    src={article.bannerImage || '/fallback.svg'} 
                    alt={article.title} 
                    fill 
                    unoptimized={true}
                    className="object-cover opacity-75 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 z-0"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />

                  <div className="absolute inset-0 flex flex-col justify-between p-6 z-20">
                    <span className="self-start px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30 uppercase tracking-wider">
                      {article.category || 'Blog'}
                    </span>
                    <h3 className="text-white text-lg font-bold tracking-wide font-heading drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-500 leading-snug">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
