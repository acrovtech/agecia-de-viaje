import { TourCard } from '../ui/tour-card';
import { prisma } from '@repo/db';
import Link from 'next/link';

export async function RecommendedTours() {
  let tours: any[] = [];

  try {
    // Fetch the latest 6 tours from the real database!
    tours = await prisma.tour.findMany({
      take: 6,
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.warn("âš ï¸ Base de datos apagada o inaccesible, usando datos de demostración.");
  }

  // If DB is empty, use some nice fallbacks so the design doesn't break
  const displayTours = tours.length > 0 ? tours : [
    {
      id: 'fallback-1',
      title: 'Selva perdida de los Incas + Machu Picchu 2 D',
      cardImage: '/fallback.svg',
      duration: '2 Días',
      difficulty: 'Moderado',
      altitude: '1,800m - 3,400m',
      groupSize: 'Pequeño',
      slug: 'selva-perdida'
    },
    {
      id: 'fallback-2',
      title: 'Salkantay Trek a Machu Picchu',
      cardImage: '/fallback.svg',
      duration: '5 Días',
      difficulty: 'Desafiante',
      altitude: 'Hasta 4,600m',
      groupSize: 'Grupal',
      slug: 'salkantay-trek'
    },
    {
      id: 'fallback-3',
      title: 'Laguna de Humantay Full Day',
      cardImage: '/fallback.svg',
      duration: '1 Día',
      difficulty: 'Moderado',
      altitude: '4,200m',
      groupSize: 'Compartido',
      slug: 'laguna-humantay'
    }
  ];

  return (
    <section className="py-20 bg-[#F9FAFA]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="section-title">
            Tours Recomendados
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Descubre las mejores experiencias seleccionadas por nuestros expertos locales para tu aventura en Perú.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTours.map((tour) => (
            <TourCard
              key={tour.id}
              title={tour.title}
              imageSrc={tour.cardImage}
              duration={tour.duration}
              difficulty={tour.difficulty || 'Moderado'}
              altitude={tour.altitude || 'Varía'}
              groupSize={tour.groupSize || 'Grupal'}
              slug={tour.slug}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/tours" 
            className="inline-flex items-center justify-center border-2 border-[#062918] text-[#062918] hover:bg-[#062918] hover:text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
          >
            Ver todos los tours
          </Link>
        </div>
      </div>
    </section>
  );
}

