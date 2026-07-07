import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AboutHero } from '@/components/about/about-hero';
import { TeamSection } from '@/components/about/team-section';
import { StatsCounter } from '@/components/about/stats-counter';
import { CertificatesSection } from '@/components/about/certificates-section';

export const metadata = {
  title: 'Nosotros | Inca Bound',
  description: 'Conoce más sobre Inca Bound, nuestro equipo de expertos locales y nuestro compromiso con el turismo sostenible en Perú.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[80dvh] min-h-[500px] w-full bg-gray-900 flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/hero-nosotros.webp')] bg-cover bg-center opacity-70" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="relative z-10 text-center px-4 mt-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
              Sobre Nosotros
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Somos especialistas en expediciones y aventuras en los Andes, conectando al mundo con la magia del Perú milenario.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <AboutHero />

        {/* 2. Equipo (Tarjetas de Guías/Staff) */}
        <TeamSection />

        {/* 3. Contador Animado (Años, Viajeros, etc.) */}
        <StatsCounter />

        {/* 4. Certificados (Con Lightbox) */}
        <CertificatesSection />
      </main>

      <Footer />
    </div>
  );
}
