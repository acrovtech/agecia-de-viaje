import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const articles = [
  {
    id: 1,
    title: 'Los Secretos Ocultos de la Ciudadela de Machu Picchu',
    image: '/fallback.svg',
    slug: 'secretos-machu-picchu'
  },
  {
    id: 2,
    title: 'Guía Definitiva para el Camino Inca',
    image: '/fallback.svg',
    slug: 'guia-camino-inca'
  },
  {
    id: 3,
    title: '5 Cosas que debes saber antes de ir a Cusco',
    image: '/fallback.svg',
    slug: 'tips-cusco'
  },
  {
    id: 4,
    title: 'La Gastronomía Andina que debes probar',
    image: '/fallback.svg',
    slug: 'gastronomia-andina'
  },
  {
    id: 5,
    title: '¿Por qué elegir el Salkantay Trek?',
    image: '/fallback.svg',
    slug: 'por-que-salkantay'
  },
  {
    id: 6,
    title: 'Aclimatación y Soroche: Guía de Supervivencia',
    image: '/fallback.svg',
    slug: 'aclimatacion-soroche'
  }
];

export function LatestArticles() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="section-title">Últimos Artículos</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16 text-lg">
          Descubre guías, tips y relatos de viajes para preparar tu próxima gran aventura en los Andes.
        </p>

        {/* CSS Native Carousel */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar">
          {articles.map((article) => (
            <Link 
              href={`/blog/${article.slug}`} 
              key={article.id} 
              className="relative group cursor-pointer overflow-hidden aspect-[4/3] bg-black block flex-none w-full sm:w-[calc(50%-12px)] md:w-[calc(33.3333%-16px)] snap-start rounded-2xl"
            >
              {/* Background Image */}
              <Image 
                src={article.image} 
                alt={article.title} 
                fill 
                className="object-cover opacity-70 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 z-0"
              />
              
              {/* Gradient overlay for bottom text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

              {/* Content - Bottom Title */}
              <div className="absolute inset-0 flex items-end justify-start p-6 text-left z-20">
                <h3 className="text-white text-[18px] font-semibold tracking-wide font-heading drop-shadow-md transform group-hover:-translate-y-2 transition-transform duration-500">
                  {article.title}
                </h3>
              </div>
              
              {/* "Street Fighter" Selection Border Effect (Modified) */}
              
              {/* Inner White L-Brackets on Hover */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-tl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-br-lg" />

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

