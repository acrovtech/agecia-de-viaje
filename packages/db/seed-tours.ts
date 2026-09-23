import { PrismaClient } from '@prisma/client';
import { tours } from './tours-data';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Operación cancelada: No se permite ejecutar seeds de demo en entorno de producción.');
    process.exit(1);
  }

  console.log("🌱 Iniciando actualización e importación limpia de Tours...");

  for (const tourData of tours) {
    const cleanTitle = tourData.title.replace(/\s*\(N\)$/i, '').trim();

    const existing = await prisma.tour.findFirst({
      where: {
        OR: [
          { slug: tourData.slug },
          { title: { contains: cleanTitle, mode: 'insensitive' } }
        ]
      }
    });

    const tourPayload = {
      title: cleanTitle,
      slug: tourData.slug,
      description: tourData.description,
      duration: tourData.duration,
      altitude: tourData.altitude,
      difficulty: tourData.difficulty,
      groupSize: tourData.groupSize,
      hasSharedService: tourData.hasSharedService,
      sharedPrice: tourData.sharedPrice,
      hasPrivateService: tourData.hasPrivateService,
      bannerImage: (tourData as any).bannerImage || '/fallback.svg',
      cardImage: (tourData as any).cardImage || '/fallback.svg',
    };

    if (existing) {
      console.log(`🔄 Actualizando tour existente: ${existing.title}`);
      await prisma.tourItineraryDay.deleteMany({ where: { tourId: existing.id } });
      await prisma.tourInclusion.deleteMany({ where: { tourId: existing.id } });
      await prisma.tourExclusion.deleteMany({ where: { tourId: existing.id } });
      await prisma.tourRecommendation.deleteMany({ where: { tourId: existing.id } });
      await prisma.tourFaq.deleteMany({ where: { tourId: existing.id } });

      await prisma.tour.update({
        where: { id: existing.id },
        data: {
          ...tourPayload,
          itineraries: { create: tourData.itineraries },
          inclusions: { create: tourData.inclusions },
          exclusions: { create: tourData.exclusions },
          recommendations: { create: tourData.recommendations },
          faqs: { create: tourData.faqs },
        }
      });
    } else {
      console.log(`✨ Creando nuevo tour: ${cleanTitle}`);
      await prisma.tour.create({
        data: {
          ...tourPayload,
          itineraries: { create: tourData.itineraries },
          inclusions: { create: tourData.inclusions },
          exclusions: { create: tourData.exclusions },
          recommendations: { create: tourData.recommendations },
          faqs: { create: tourData.faqs },
        }
      });
    }
  }

  const validSlugs = tours.map(t => t.slug);
  const deleted = await prisma.tour.deleteMany({
    where: {
      slug: { notIn: validSlugs }
    }
  });
  if (deleted.count > 0) {
    console.log(`🧹 Eliminados ${deleted.count} tours obsoletos.`);
  }

  const finalCount = await prisma.tour.count();
  console.log(`✅ Reimportación finalizada: ${finalCount} tours en base de datos.`);
}

main()
  .catch(e => {
    console.error("❌ Error en seed-tours:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
