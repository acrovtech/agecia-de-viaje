import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';

export default function EsnnaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[80dvh] min-h-[500px] w-full bg-gray-900 flex items-center justify-center">
          <div className="absolute inset-0">
            <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/esnna-hero.webp" alt="ESNNA Inca Bound" fill sizes="100vw" className="object-cover" priority unoptimized={true} />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-10 text-center px-4 mt-16">
            <h1 className="text-3xl md:text-5xl font-bold text-white font-heading tracking-tight drop-shadow-md">
              Comprometidos con la Erradicación de la ESNNA
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight mb-8">
              Código de Conducta
            </h2>
            
            <div className="space-y-6 text-gray-600 leading-relaxed text-lg mb-16">
              <p>
                En <strong>Inca Bound</strong>, estamos profundamente comprometidos con la protección de los más vulnerables. Nos adherimos estrictamente al Código de Conducta contra la Explotación Sexual de Niñas, Niños y Adolescentes (ESNNA) en el ámbito del turismo y los viajes.
              </p>
              <p>
                Creemos que el turismo debe ser una fuerza positiva para el desarrollo social y cultural. Por ello, capacitamos a todo nuestro personal, guías y operadores para identificar, prevenir y denunciar cualquier actividad sospechosa que vulnere los derechos de los menores.
              </p>
              <p>
                Nuestra política de <strong>Tolerancia Cero</strong> significa que no permitimos ni facilitamos ningún acto de explotación infantil en nuestras operaciones ni en la cadena de suministro turístico. Invitamos a todos nuestros viajeros a unirse a esta causa y a reportar cualquier incidente a las autoridades locales competentes.
              </p>
            </div>

            {/* Images */}
            <div className="border-t border-gray-100 pt-16">
              <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                {/* Imagen 1 */}
                <div className="w-full md:w-[400px] h-auto aspect-[4/5] relative">
                  <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/certificado-esnna-turismo-cusco.webp" alt="ESNNA Turismo Cusco" fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain" unoptimized={true} />
                </div>

                {/* Imagen 2 */}
                <div className="w-full md:w-[400px] h-auto aspect-[4/5] relative">
                  <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/codigo-conducta-esnna-inca-bound.webp" alt="Código de Conducta ESNNA" fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain" unoptimized={true} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
