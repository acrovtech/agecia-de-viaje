import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContactForm } from '@/components/contact/contact-form';
import { ContactInfo } from '@/components/contact/contact-info';

export const metadata = {
  title: 'Contacto | Inca Bound',
  description: 'Contáctanos para organizar tu viaje a Perú, Cusco y Machu Picchu.',
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[80dvh] min-h-[500px] w-full bg-gray-900 flex items-center justify-center">
          <div className="absolute inset-0">
            {/* Background Image */}
            <div className="absolute inset-0 bg-[url('/agencia-viajes-cusco-contacto.webp')] bg-cover bg-center opacity-70" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="relative z-10 text-center px-4 mt-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
              Contáctanos
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              ¿Listo para vivir la mejor experiencia en los Andes? Estamos a un mensaje de distancia.
            </p>
          </div>
        </div>

        {/* Contact Grid */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 w-full mb-20">
            <ContactInfo />
            <ContactForm />
          </div>
          
          {/* Full Width Map Row */}
          <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1938.9669527787352!2d-71.98064402636402!3d-13.518600196238681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x916dd5d8276f571b%3A0xc6eb154546419bc9!2sCalle%20Marquez%20231%2C%20Cusco%2008002!5e0!3m2!1ses!2spe!4v1704200000000!5m2!1ses!2spe" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Inca Bound"
            ></iframe>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
