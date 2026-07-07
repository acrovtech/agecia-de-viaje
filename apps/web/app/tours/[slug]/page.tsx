import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TourHero } from '@/components/tour/tour-hero';
import { TourTabs } from '@/components/tour/tour-nav';
import { TourItinerary } from '@/components/tour/tour-itinerary';
import { TourBookingCard } from '@/components/tour/tour-booking-card';
import { Check, X, MapPin, Clock, Mountain, Users, BarChart } from 'lucide-react';
import Image from 'next/image';

// MOCK DATA: Este objeto simula lo que vendrá de la base de datos en el futuro
const mockTour = {
  id: 'camino-inca-4-dias',
  title: 'Camino Inca a Machu Picchu',
  subtitle: 'La caminata más famosa de Sudamérica',
  image: '/salkantay.webp',
  price: 550,
  privatePrice: 750,
  duration: '4 Días / 3 Noches',
  difficulty: 'Moderada - Desafiante',
  groupSize: 'Máximo 8 personas',
  maxAltitude: '4,215 m.s.n.m',
  overview: 'El Camino Inca a Machu Picchu es considerado una de las mejores caminatas del mundo. Combina diversos ecologismos, desde la puna andina hasta el bosque nuboso, impresionantes sitios arqueológicos y paisajes majestuosos.',
  itinerary: [
    {
      day: 1,
      title: 'Cusco – Km 82 – Wayllabamba',
      description: 'Partimos temprano desde Cusco hacia el Km 82, donde iniciaremos nuestra caminata oficial. El primer día es relativamente fácil y nos sirve como calentamiento.',
      details: [
        { label: 'Distancia', value: '12 km' },
        { label: 'Tiempo estimado', value: '5 - 6 horas' },
        { label: 'Altitud máxima', value: '3,000 m' },
        { label: 'Comidas', value: 'Almuerzo, Cena' }
      ]
    },
    {
      day: 2,
      title: 'Wayllabamba – Warmiwañusca – Pacaymayo',
      description: 'El día más desafiante. Subiremos al Paso de la Mujer Muerta (Warmiwañusca) a 4,215m, el punto más alto de todo el camino.',
      details: [
        { label: 'Distancia', value: '11 km' },
        { label: 'Tiempo estimado', value: '7 - 8 horas' },
        { label: 'Altitud máxima', value: '4,215 m' },
        { label: 'Comidas', value: 'Desayuno, Almuerzo, Cena' }
      ]
    },
    {
      day: 3,
      title: 'Pacaymayo – Wiñay Wayna',
      description: 'Considerado por muchos el día más hermoso del trek. Atravesaremos diferentes ecosistemas y visitaremos asombrosos sitios arqueológicos.',
      details: [
        { label: 'Distancia', value: '16 km' },
        { label: 'Tiempo estimado', value: '8 - 9 horas' },
        { label: 'Altitud máxima', value: '3,950 m' },
        { label: 'Comidas', value: 'Desayuno, Almuerzo, Cena' }
      ]
    },
    {
      day: 4,
      title: 'Wiñay Wayna – Machu Picchu – Cusco',
      description: 'Nos levantaremos de madrugada para llegar a la Puerta del Sol (Inti Punku) y ver los primeros rayos de sol sobre Machu Picchu.',
      details: [
        { label: 'Distancia', value: '6 km' },
        { label: 'Tiempo estimado', value: '2 - 3 horas' },
        { label: 'Altitud máxima', value: '2,720 m' },
        { label: 'Comidas', value: 'Desayuno' }
      ]
    }
  ],
  inclusions: [
    'Transporte Cusco - Km 82.',
    'Boleto de ingreso al Camino Inca y Machu Picchu.',
    'Guía profesional bilingüe (Español/Inglés).',
    'Equipo de campamento (carpas, colchonetas).',
    'Alimentación durante la caminata (3D, 3A, 3C).',
    'Tren de retorno (Aguas Calientes - Ollantaytambo).'
  ],
  exclusions: [
    'Bolsa de dormir (Sleeping bag).',
    'Almuerzo del cuarto día.',
    'Ingreso a la montaña Huayna Picchu.',
    'Propinas para el equipo de ruta.'
  ],
  faqs: [
    { question: '¿Cuál es la mejor época para hacer el Camino Inca?', answer: 'La temporada seca (de mayo a octubre) es la mejor época, ya que hay menos probabilidades de lluvia y los días suelen ser soleados.' },
    { question: '¿Necesito prepararme físicamente?', answer: 'Sí, recomendamos hacer caminatas de preparación y pasar al menos 2 días en Cusco (o en una ciudad de altura) para aclimatarse antes de iniciar el tour.' },
    { question: '¿Cómo funciona la reserva de espacios?', answer: 'El Camino Inca tiene un límite estricto de 500 personas por día (incluyendo guías y porteadores). Te sugerimos reservar con al menos 4 a 6 meses de anticipación.' },
    { question: '¿Hay baños y duchas durante el trayecto?', answer: 'Existen baños básicos tipo letrina en los campamentos. Las duchas (frías) solo están disponibles en el tercer campamento (Wiñay Wayna).' }
  ]
};

export default function TourPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <TourHero tour={mockTour} />

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative items-start">
            
            {/* Columna Izquierda: Contenido del Tour (70%) */}
            <div className="w-full lg:w-2/3 flex flex-col gap-12">
              
              {/* Sección: Resumen (Ficha Técnica, Mapa y Descripción) */}
              <section id="resumen" className="scroll-mt-32">
                <div className="mb-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <Clock size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Duración</p>
                        <p className="text-sm text-gray-500">{mockTour.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <BarChart size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Dificultad</p>
                        <p className="text-sm text-gray-500">{mockTour.difficulty}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <Users size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Tamaño de Grupo</p>
                        <p className="text-sm text-gray-500">{mockTour.groupSize}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <Mountain size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Altitud</p>
                        <p className="text-sm text-gray-500">{mockTour.maxAltitude}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción del Tour */}
                <div className="mb-10">
                  <p className="text-gray-600 text-[17px] leading-relaxed">
                    {mockTour.overview}
                  </p>
                </div>
                {/* Tabs Component taking over the rest of the sections */}
                <TourTabs tour={mockTour} />
              </section>

            </div>

            {/* Columna Derecha: Sticky Booking Box (30%) */}
            <div className="w-full lg:w-1/3 sticky top-32 flex flex-col gap-8">
              {/* Mapa de la Ruta */}
              <div className="w-full h-[250px] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 border border-gray-200 relative overflow-hidden">
                <MapPin size={48} className="mb-4 text-gray-300" />
                <span className="font-medium">Espacio para Mapa Interactivo</span>
              </div>
              <TourBookingCard 
                tourTitle={mockTour.title}
                slug={mockTour.slug}
                price={mockTour.price} 
                privatePrice={mockTour.privatePrice} 
              />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
