import { PrismaClient } from '@prisma/client';
import { tours } from './tours-data';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando actualización e importación limpia de Tours...");

  for (const tourData of tours) {
    const cleanTitle = tourData.title.replace(/\s*\(N\)$/i, '').trim();

    // Eliminar si ya existe para re-crear con itinerario agrupado
    const existing = await prisma.tour.findFirst({
      where: {
        OR: [
          { slug: tourData.slug },
          { title: { contains: cleanTitle, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      console.log(`🗑️ Eliminando versión antigua de: ${existing.title}`);
      await prisma.tour.delete({
        where: { id: existing.id }
      });
    }

    console.log(`✨ Creando tour reestructurado: ${cleanTitle}`);
    await prisma.tour.create({
      data: {
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
        itineraries: {
          create: tourData.itineraries
        },
        inclusions: {
          create: tourData.inclusions
        },
        exclusions: {
          create: tourData.exclusions
        },
        recommendations: {
          create: tourData.recommendations
        },
        faqs: {
          create: tourData.faqs
        }
      }
    });
  }

  console.log("✅ Reimportación de tours finalizada exitosamente.");
}

main()
  .catch(e => {
    console.error("❌ Error en seed-tours:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
