import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { Shield, Wind, Stethoscope, MapPin, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Nuestro Transporte | IncaBound',
  description: 'Conoce nuestra flota de vehículos modernos y seguros para tus tours en Perú. Comodidad, seguridad y conductores expertos.',
};

export default function TransportePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-20 w-full bg-gray-900 flex flex-col justify-center min-h-[80dvh]">
        <div className="absolute inset-0">
          <Image 
            src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/transporte-hero.webp" 
            alt="Transporte Turístico IncaBound" 
            fill 
            className="object-cover opacity-60" 
            priority 
            unoptimized={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-black/30" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-lg mb-4">
            Nuestra Flota de Transporte
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto">
            Viaja con la máxima comodidad, seguridad y respaldo en cada una de tus aventuras por los Andes peruanos.
          </p>
        </div>
      </div>

      <main className="flex-1">
        {/* Intro Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-[#062918] mb-6">Tu Seguridad es Nuestra Prioridad</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              En IncaBound entendemos que el transporte es una parte fundamental de tu experiencia de viaje. 
              Por ello, contamos con una flota de vehículos modernos, estrictamente mantenidos y equipados 
              para garantizar viajes seguros y confortables por las exigentes rutas andinas.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center transition-transform hover:-translate-y-1">
                <div 
                  className="w-16 h-16 bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center mx-auto mb-6"
                  style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                >
                  <Shield size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#062918] mb-3">Conductores Expertos</h3>
                <p className="text-gray-600 text-sm">
                  Profesionales altamente capacitados con años de experiencia en las rutas de la región.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center transition-transform hover:-translate-y-1">
                <div 
                  className="w-16 h-16 bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center mx-auto mb-6"
                  style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                >
                  <Wind size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#062918] mb-3">Confort Total</h3>
                <p className="text-gray-600 text-sm">
                  Asientos reclinables, amplio espacio, aire acondicionado y calefacción en todos nuestros vehículos.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center transition-transform hover:-translate-y-1">
                <div 
                  className="w-16 h-16 bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center mx-auto mb-6"
                  style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                >
                  <Stethoscope size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#062918] mb-3">Equipamiento Médico</h3>
                <p className="text-gray-600 text-sm">
                  Botiquín de primeros auxilios completo y balón de oxígeno disponible para emergencias de altitud.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center transition-transform hover:-translate-y-1">
                <div 
                  className="w-16 h-16 bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center mx-auto mb-6"
                  style={{ borderRadius: '70% 30% 30% 70% / 60% 40% 60% 40%' }}
                >
                  <MapPin size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#062918] mb-3">Monitoreo GPS</h3>
                <p className="text-gray-600 text-sm">
                  Seguimiento satelital en tiempo real durante todo el recorrido para tu total tranquilidad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tipos de Vehículos */}
        <section className="pt-16 pb-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <h2 className="text-3xl font-bold text-[#062918] mb-12 text-center">Conoce Nuestra Flota</h2>
            
            <div className="space-y-12">
              {/* Vehículo 1 */}
              <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <div className="w-full md:w-1/2 relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm">
                  <Image 
                    src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/flota/sprinter-cusco.webp" 
                    alt="Mercedes-Benz Sprinter Turística IncaBound"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    unoptimized={true}
                  />
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="inline-block px-3 py-1 bg-[#2dd4bf]/10 text-[#062918] font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                    Tours Grupales
                  </div>
                  <h3 className="text-2xl font-bold text-[#062918]">Sprinter Turística</h3>
                  <p className="text-gray-600">
                    Nuestros minibuses Mercedes-Benz son la opción preferida para nuestros tours grupales. Combinan tecnología alemana de vanguardia con un interior diseñado específicamente para el turismo de lujo.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Capacidad: 15 a 19 pasajeros
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Asientos ergonómicos reclinables
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Ventanas panorámicas tintadas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Sistema de audio con micrófono para el guía
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vehículo 2 */}
              <div className="flex flex-col md:flex-row-reverse gap-8 items-center bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <div className="w-full md:w-1/2 relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm">
                  <Image 
                    src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/flota/minivan-valle-sagrado.webp" 
                    alt="Minivan Ejecutiva Toyota Hiace IncaBound"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    unoptimized={true}
                  />
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="inline-block px-3 py-1 bg-[#2dd4bf]/10 text-[#062918] font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                    Grupos Pequeños & Privados
                  </div>
                  <h3 className="text-2xl font-bold text-[#062918]">Minivans Ejecutivas</h3>
                  <p className="text-gray-600">
                    Ideales para familias o grupos de amigos que contratan servicios en privado. Ofrecen la agilidad de un vehículo pequeño pero con el espacio y comodidad de un transporte de turismo.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Capacidad: 6 a 10 pasajeros
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Climatización independiente
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Suspensión suave para rutas empedradas
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vehículo 3 */}
              <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <div className="w-full md:w-1/2 relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm">
                  <Image 
                    src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/flota/suv-privado-andes.webp" 
                    alt="Camioneta SUV 4x4 Toyota Prado IncaBound"
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    unoptimized={true}
                  />
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="inline-block px-3 py-1 bg-[#2dd4bf]/10 text-[#062918] font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                    Expediciones & VIP
                  </div>
                  <h3 className="text-2xl font-bold text-[#062918]">Camionetas 4x4</h3>
                  <p className="text-gray-600">
                    Para las rutas de aventura, expediciones fotográficas o clientes VIP que buscan acceder a lugares remotos de difícil acceso con el máximo confort y potencia garantizada.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Capacidad: 2 a 4 pasajeros
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Tracción en las 4 ruedas (AWD/4WD)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#2dd4bf]" /> Interior de cuero y máxima seguridad
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
