'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const MOCK_IMAGES = [
  "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-inca-bound.webp",
  "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/experiencia-viajes-inca-bound.webp",
  "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/viajes-seguros-peru-inca-bound.webp",
];

export function WhyUs() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCK_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 lg:py-32 bg-white text-gray-800 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16">
          
          {/* Text Content */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[#062918] leading-tight">
              ¿Por qué viajar con <span className="text-[#2dd4bf]">Inca Bound</span>?
            </h2>
            
            <div className="space-y-6 text-base md:text-lg leading-relaxed text-gray-600">
              <p>
                Si buscas vivir la mejor experiencia de tu vida y disfrutar de unas <strong>vacaciones inolvidables en Perú</strong>, con <strong>Inca Bound</strong> tendrás la oportunidad de conocer muy de cerca la cultura, la más fina gastronomía y todas las comodidades para hacer de tu viaje una experiencia maravillosa.
              </p>
              <p>
                Con más de 20 años de experiencia y un selecto equipo de profesionales comprometidos, garantizamos una atención personalizada. Al viajar con nosotros, contribuyes al desarrollo de las comunidades locales y te sumas a un <strong>turismo responsable y ecológico</strong>, protegiendo nuestro planeta.
              </p>
            </div>
          </div>

          {/* Image Carousel */}
          <div 
            className="relative w-full max-w-xl lg:max-w-none h-[400px] md:h-[500px] lg:h-[600px] mx-auto overflow-hidden shadow-2xl bg-gray-100"
            style={{ WebkitMaskImage: "url('https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/mascara.webp')", maskImage: "url('https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/mascara.webp')", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" }}
          >
            {MOCK_IMAGES.map((src, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <Image 
                  src={src} 
                  alt={`Experiencia Inca Bound ${idx + 1}`} 
                  fill 
                  className="object-cover"
                  priority={idx === 0}
                  unoptimized={true}
                />
              </div>
            ))}
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
              {MOCK_IMAGES.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/40 hover:bg-white/80'}`}
                  aria-label={`Ver imagen ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

