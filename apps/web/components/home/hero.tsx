'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function Hero() {
  const [showIframe, setShowIframe] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    // Defer heavy video iframe DOM insertion to prioritize initial FCP/LCP
    const timer = setTimeout(() => setShowIframe(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Video & Poster Background */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Poster Base Layer: Always visible to guarantee 0ms instant display and ZERO black flash */}
        <Image 
          src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/Hero-Home.webp" 
          alt="Inca Bound Hero" 
          fill 
          sizes="100vw"
          priority 
          unoptimized={true}
          className="object-cover" 
        />
        
        {/* Vimeo Video Layer: Fades in smoothly ONLY when iframe onLoad fires */}
        {showIframe && (
          <iframe 
            src="https://player.vimeo.com/video/1109193500?muted=1&autoplay=1&loop=1&background=1&quality=720p&app_id=122963" 
            title="Video de presentación Inca Bound"
            onLoad={() => setIsVideoReady(true)}
            className={`w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-1000 ${
              isVideoReady ? 'opacity-100' : 'opacity-0'
            }`}
            frameBorder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowFullScreen
          ></iframe>
        )}
      </div>
      
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>

      {/* Main Content */}
      <div className="relative z-20 text-center text-white px-4 flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto pt-20 lg:pt-0">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight drop-shadow-lg leading-tight px-8 lg:px-0">
          Explora Perú de la forma más auténtica con Inca Bound
        </h1>
        <p className="text-sm md:text-base lg:text-lg font-medium drop-shadow-md max-w-2xl mx-auto px-8 lg:px-0">
          Aventura con propósito: cultura, sabor y paisajes inolvidables.
        </p>
        
        {/* Social Icons for Mobile & Tablet (Under text) */}
        <div className="flex lg:hidden gap-4 mt-8">
          <a href="https://www.facebook.com/incabound?locale=es_LA" target="_blank" rel="noopener noreferrer" aria-label="Facebook de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="https://www.instagram.com/incabound/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
            <svg viewBox="0 0 576 512" fill="currentColor" width="22" height="22"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
          </a>
        </div>
      </div>

      {/* Right Floating Social Icons (Desktop only) */}
      <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 flex-col gap-4">
        <a href="https://www.facebook.com/incabound?locale=es_LA" target="_blank" rel="noopener noreferrer" aria-label="Facebook de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
        </a>
        <a href="https://www.instagram.com/incabound/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </a>
        <a href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor de Inca Bound" className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-sm transition-colors text-white">
          <svg viewBox="0 0 576 512" fill="currentColor" width="20" height="20"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
        </a>
      </div>

      {/* Bottom Badges */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:-translate-x-0 lg:right-8 z-30 flex items-center justify-center gap-3 md:gap-5 scale-[0.9] sm:scale-100 md:scale-110 lg:scale-[1.35] lg:origin-bottom-right w-full lg:w-auto">
        <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/wta-2024.webp" alt="World Travel Awards 2024" width={120} height={120} className="w-24 md:w-32 h-auto drop-shadow-lg" unoptimized={true} />
        <a href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" target="_blank" rel="noopener noreferrer" aria-label="Ver opiniones y reconocimientos de Inca Bound en TripAdvisor" className="flex items-center gap-3 md:gap-5 p-2">
          <Image src="/ta-2022.svg" alt="Tripadvisor 2022" width={120} height={120} className="w-24 md:w-32 h-auto drop-shadow-lg" />
          <Image src="/ta-2023.svg" alt="Tripadvisor 2023" width={120} height={120} className="w-24 md:w-32 h-auto drop-shadow-lg" />
          <Image src="/ta-2024.svg" alt="Tripadvisor 2024" width={120} height={120} className="w-24 md:w-32 h-auto drop-shadow-lg" />
        </a>
      </div>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/51984772299" target="_blank" rel="noopener noreferrer" aria-label="Contactar a Inca Bound por WhatsApp" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1" />
        </svg>
      </a>
    </section>
  );
}
