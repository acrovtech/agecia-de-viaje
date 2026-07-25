'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: "Paola G",
    date: "1 year ago",
    title: "Recomendasimo!",
    text: "Una experiencia totalmente hermosa! Vale la pena el cansancio para llegar a ver ese paisaje Mi guía fue Jeferson y 10/10 excelente actitud, buena vibra, pendiente de todos y excelente fotógrafo .",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/de/e7/default-avatar-2020-37.jpg"
  },
  {
    name: "Jose Daniel S",
    date: "2 years ago",
    title: "Muy recomendados, excelente experiencia.",
    text: "Excelente experiencia, hicimos el tour al Humantay, nos correspondió con el guia Miguel y nos dió un acompañamiento excelente. Además de que el tour incluía desayuno y almuerzo en un lugar lindo y con bastantes opciones.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/ed/00/default-avatar-2020-4.jpg"
  },
  {
    name: "César Fernando ... P",
    date: "2 years ago",
    title: "7 colores tour",
    text: "Excelente agencia de turismo. El itinerario al 100%, la visita a 7 colores cumplió la espectativa. El clima fue genial y el guía Miguel excepcional, colaborador y presto. Así mismo, te ayuda con fotos y te da información para llegar a lugares de gran panorámicas.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/eb/a3/default-avatar-2020-38.jpg"
  },
  {
    name: "Cesar R",
    date: "2 years ago",
    title: "Excelente trip a la laguna con el guía Miguel",
    text: "Todo estuvo perfecto, el transporte estuvo en tiempo, el desayuno estuvo bien y el guía Miguel estuvo 10/10!! lo súper recomiendo, nos tuvo paciencia y nos explicó súper bien todo. Recomendadisimo. Solo el almuerzo quedó un poco a deber porque las bebidas frías tenían costo",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/f0/9f/default-avatar-2020-16.jpg"
  },
  {
    name: "Carla E",
    date: "2 years ago",
    title: "Genial montaña de siete colores y Laguna Humantay",
    text: "Nosotras hicimos dos excursiones. Montaña de colores y Laguna Humantay. Nuestro guia en las dos fue Miguel. En todo momento atento con el mal de altura y preocupándose por nuestro estado de salud.La montaña de siete colores fue muy bien. Sim embargo, la laguna Humantay fue una experiencia que siempre recordaremos. Además Miguel nos contó la historia del sitio e hicimos todos juntos un ritual que aumentó el sentido de la experiencia.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/e3/1f/default-avatar-2020-46.jpg"
  },
  {
    name: "Yara Barbosa",
    date: "2 years ago",
    title: "A melhor experiência em Cusco",
    text: "Estive em visita à Cusco entre março e abril de 2024, e fui a Laguna Humantai com o guia Miguel e foi uma experiência impar. Tudo ocorreu perfeitamente, orientações, informações sobre o lugar, suporte ao grupo e toda assistência necessária. Super recomendo e o diferencial do passeio foi a cortesia, educação, disponibilidade do guia turistico Miguel além de todo seu conhecimento profissional.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/eb/a3/default-avatar-2020-38.jpg"
  },
  {
    name: "Pedro Vitor",
    date: "2 years ago",
    title: "Tours incríveis, ótimas lembranças",
    text: "Fizemos dois passeios, Laguna Humantay e Montaña de Colores e fomos muito bem recepcionados pelo guia Miguel, todos os passeios ocorreram sem atrasados desde o acolhimento no hotel até o final. Fiquei muito feliz com o trabalho do guia que sempre se preocupava com quem estava tendo dificultades no trajeto (eu kkk, brasileiro não é acostumado com essa altitude). No fim, passeios incríveis, um excelente serviço e ótimas experiências, voltarei a fazer mais passeios com vocês",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-m/1280/2c/70/c1/cd/caption.jpg"
  },
  {
    name: "Hudson Queiroz",
    date: "2 years ago",
    title: "Melhor guia dos passeios turísticos: Miguel.",
    text: "Os passeios que fiz com o guia Miguel foram os melhores. Super respeitoso, educado, muito alegre, não deixou ninguém desamparado e encorajava a todos nas trilhas. Excelente profissional.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/f1/79/default-avatar-2020-21.jpg"
  },
  {
    name: "Eliana Constanz... A",
    date: "2 years ago",
    title: "Fenomenal",
    text: "El servicio fue excelente, Miguel todo un profesional en el momento de ejercer su trabajo, me sentí muy a gusto en todo el tour, además que es muy buen fotógrafo!",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/2b/60/03/df/caption.jpg"
  },
  {
    name: "Thaís d",
    date: "2 years ago",
    title: "Laguna Humantay e gran guia",
    text: "increíble recorrido. La impresionante belleza de la laguna Humantay vale la pena subir. Destacado para el guía Miguel que acompañó al grupo en todo momento de forma servicial y alegre.",
    avatar: "https://media-cdn.tripadvisor.com/media/photo-o/1a/f6/de/0a/default-avatar-2020-35.jpg"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="section-title">
            Nuestros viajeros <span className="text-brand-blue">lo confirman</span>
          </h2>
          <p className="text-gray-600 text-[17px] leading-relaxed">
            Historias reales de personas que vivieron la magia del Perú con Inca Bound. Más de 1000 opiniones de 5 estrellas en TripAdvisor nos respaldan.
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="w-full px-4 lg:px-8 max-w-[1600px] mx-auto">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="flex-none w-full sm:w-[calc(50%-12px)] md:w-[calc(33.3333%-16px)] xl:w-[calc(25%-18px)] snap-start shrink-0"
              >
                {/* Removed Shadows entirely per request */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 h-full flex flex-col">
                  {/* Top Row: Avatar, Name & Date, TA Logo */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-100">
                        <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[15px] leading-tight">{testimonial.name}</p>
                        <p className="text-[13px] text-gray-600 mt-0.5">{testimonial.date}</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#00aa6c] flex items-center justify-center text-white shrink-0">
                      <svg viewBox="0 0 576 512" fill="currentColor" width="12" height="12"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
                    </div>
                  </div>

                  {/* Second Row: TA Bubbles & Verified Badge */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex items-center gap-[3px]">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#00aa6c] flex items-center justify-center p-[2px] shrink-0">
                          <div className="w-full h-full bg-[#00aa6c] rounded-full" />
                        </div>
                      ))}
                    </div>
                    {/* Verified Badge */}
                    <div className="text-[#3a86ff] flex-none flex items-center justify-center ml-1 w-4 h-4">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Third Row: Review Text */}
                  <div className="flex-1">
                    <p className="text-[#333333] text-[15px] leading-relaxed line-clamp-4">
                      {testimonial.title && <span className="block mb-1 font-medium">{testimonial.title}</span>}
                      {testimonial.text}
                    </p>
                  </div>
                  
                  {/* Bottom Row: Leer más */}
                  <a 
                    href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-left mt-3 text-[#008060] hover:text-[#062918] text-[14px] font-semibold transition-colors inline-block"
                  >
                    Leer más
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
    </section>
  );
}
