import { TourCard } from '../ui/tour-card';
import { prisma } from '@repo/db';
import Link from 'next/link';

export async function RecommendedTours() {
  let tours: any[] = [];

  try {
    // Mostrar ÚNICAMENTE los tours marcados como destacados en el admin
    tours = await prisma.tour.findMany({
      where: { isFeatured: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // Si aún no se ha marcado ningún tour como destacado, mostrar los más recientes de respaldo
    if (tours.length === 0) {
      tours = await prisma.tour.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      });
    }
  } catch (error) {
    console.error("Error cargando tours recomendados:", error);
  }

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

        {tours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-8 max-w-xl mx-auto shadow-xs">
            <p className="text-gray-700 font-semibold text-lg">Nuevas experiencias disponibles próximamente</p>
            <p className="text-sm text-gray-500 mt-2">Estamos actualizando nuestro catálogo de tours para brindarte la mejor experiencia en Perú.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                title={tour.title}
                imageSrc={tour.cardImage || '/placeholder.jpg'}
                duration={tour.duration}
                difficulty={tour.difficulty || 'Moderado'}
                altitude={tour.altitude || 'Varía'}
                groupSize={tour.groupSize || 'Grupal'}
                slug={tour.slug}
              />
            ))}
          </div>
        )}

        {tours.length > 0 && (
          <div className="mt-12 text-center">
            <Link 
              href="/tours" 
              className="inline-flex items-center justify-center border-2 border-[#062918] text-[#062918] hover:bg-[#062918] hover:text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              Ver todos los tours
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
