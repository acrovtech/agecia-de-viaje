import { TourCard } from '../ui/tour-card';
import { prisma } from '@repo/db';
import Link from 'next/link';

export async function RecommendedTours() {
  let tours: any[] = [];

  try {
    // Priorizar tours marcados como destacados en el admin
    tours = await prisma.tour.findMany({
      where: { isFeatured: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // Rellenar con los más recientes si hay menos de 6 destacados
    if (tours.length < 6) {
      const existingIds = tours.map(t => t.id);
      const recentTours = await prisma.tour.findMany({
        where: { id: { notIn: existingIds } },
        take: 6 - tours.length,
        orderBy: { createdAt: 'desc' },
      });
      tours = [...tours, ...recentTours];
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
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 max-w-xl mx-auto shadow-sm">
            <p className="text-gray-600 font-medium">Aún no se han publicado tours en la base de datos.</p>
            <p className="text-xs text-gray-400 mt-1">Los paquetes creados desde el panel de administración aparecerán aquí automáticamente.</p>
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
