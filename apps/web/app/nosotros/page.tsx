import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AboutHero } from '@/components/about/about-hero';
import { StatsCounter } from '@/components/about/stats-counter';
import { CertificatesSection } from '@/components/about/certificates-section';
import Image from 'next/image';

export const metadata = {
  title: 'Nosotros | Agencia de Viajes',
  description: 'Conoce más sobre nuestra historia, equipo y nuestro compromiso con el turismo sostenible en Perú.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section Normalizado */}
        <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/hero-nosotros.webp" 
              alt="Sobre Nosotros" 
              fill 
              sizes="100vw" 
              className="object-cover" 
              priority 
              unoptimized={true} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
          </div>
          
          <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-white mb-4 drop-shadow-lg leading-tight tracking-tight">
              Sobre Nosotros
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Somos especialistas en expediciones y aventuras en los Andes, conectando al mundo con la magia del Perú milenario.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <AboutHero />

        {/* 3. Contador Animado (Años, Viajeros, etc.) */}
        <StatsCounter />

        {/* 4. Certificados (Con Lightbox) */}
        <CertificatesSection />
      </main>

      <Footer />
    </div>
  );
}
