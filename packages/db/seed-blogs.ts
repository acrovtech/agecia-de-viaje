import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const R2_BASE = 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs';

export const blogsData = [
  {
    title: 'Guía Completa para Visitar la Laguna Humantay en 2026: Consejos, Altitud y Clima',
    slug: 'guia-visitar-laguna-humantay',
    bannerImage: `${R2_BASE}/1784875453808-laguna-humantay-banner.webp`,
    metaTitle: 'Guía para Visitar la Laguna Humantay - Agencia de Viajes',
    metaDescription: 'Descubre cómo preparar tu excursión a la Laguna Humantay a 4,200 m.n.m. Consejos de aclimatación, mejor época para viajar y qué llevar.',
    keywords: 'Laguna Humantay, Tour Humantay, Caminata Humantay Cusco, Altitud Humantay',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Una joya turquesa a los pies del Nevado Salkantay',
        content: 'La Laguna Humantay es uno de los destinos paisajísticos más impactantes de la región del Cusco. Ubicada a 4,200 metros sobre el nivel del mar, esta impresionante laguna de aguas turquesas se alimenta del deshielo del majestuoso nevado Humantay. Su color vibrante varía según la luz del sol, creando un espectáculo natural inolvidable.',
        image: `${R2_BASE}/1784875457819-laguna-humantay-1.webp`
      },
      {
        order: 2,
        subtitle: '¿Cómo llegar y cuál es el nivel de dificultad?',
        content: 'El recorrido inicia temprano en la ciudad del Cusco con un viaje en transporte de aproximadamente 3 horas hacia Mollepata y Challacancha. Desde allí, comienza una caminata ascendente de unos 3.5 kilómetros. Aunque la distancia es corta, la altitud y la inclinación del terreno hacen que la exigencia sea moderada a alta. Es fundamental caminar a un ritmo constante y llevar bastones de trekking.',
        image: `${R2_BASE}/1784875460788-laguna-humantay-2.webp`
      },
      {
        order: 3,
        subtitle: 'Consejos de aclimatación y equipamiento esencial',
        content: 'Recomendamos estar en Cusco al menos 2 días antes de realizar el tour para aclimatar tu cuerpo a la altura. Lleva ropa en capas (abrigo cortaviento, casaca térmica), protector solar, agua, hojas de coca o muña para el soroche, y calzado de montaña con buen agarre.',
        image: `${R2_BASE}/1784875463197-laguna-humantay-3.webp`
      }
    ]
  },
  {
    title: 'Montaña de 7 Colores (Vinicunca): Todo lo que Debes Saber Antes de tu Viaje',
    slug: 'montana-de-7-colores-vinicunca-guia-viaje',
    bannerImage: `${R2_BASE}/1784875465196-vinicunca-banner.webp`,
    metaTitle: 'Guía de Viaje Montaña de 7 Colores Vinicunca - Agencia de Viajes',
    metaDescription: 'Información esencial para conocer la famosa Montaña de Colores Vinicunca en Cusco. Consejos de altura, clima y recomendaciones de vestimenta.',
    keywords: 'Montaña de 7 Colores, Vinicunca, Rainbow Mountain Cusco, Tour Vinicunca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El arcoíris terrestre de los Andes peruanos',
        content: 'Conocida mundialmente como la Montaña Arcoíris o Vinicunca, esta maravilla geológica debe sus franjas de tonos rojizos, amarillos, morados y dorados a la oxidación de minerales marinos y continentales depositados durante millones de años.',
        image: `${R2_BASE}/1784875469460-vinicunca-1.webp`
      },
      {
        order: 2,
        subtitle: 'Ubicación y altura máxima de la cima',
        content: 'Situada en la cordillera del Vilcanota a 5,200 metros de altitud, Vinicunca exige una preparación adecuada. El frío y el viento en la cumbre son intensos, por lo que vestir prendas abrigadoras e impermeables es indispensable.',
        image: `${R2_BASE}/1784875473626-vinicunca-2.webp`
      },
      {
        order: 3,
        subtitle: 'La mejor época para contemplar sus colores deslumbrantes',
        content: 'La época seca, entre los meses de abril y noviembre, ofrece días despejados con cielos celestes brillantes que resaltan los pigmentos naturales de la montaña en todo su esplendor.',
        image: `${R2_BASE}/1784875476140-vinicunca-3.webp`
      }
    ]
  },
  {
    title: 'Valle Sagrado de los Incas: Pisac, Ollantaytambo y Chinchero en 1 Día',
    slug: 'valle-sagrado-incas-pisac-ollantaytambo-chinchero',
    bannerImage: `${R2_BASE}/1784875478876-valle-sagrado-banner.webp`,
    metaTitle: 'Tour Valle Sagrado de los Incas: Pisac y Ollantaytambo - Agencia de Viajes',
    metaDescription: 'Explora la historia, andenerías y arquitectura viva del Valle Sagrado de los Incas. Una guía completa por Pisac, Ollantaytambo y Chinchero.',
    keywords: 'Valle Sagrado Cusco, Pisac Ollantaytambo, Tour Valle Sagrado, Arqueologia Inca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El corazón agrícola y espiritual del Imperio Inca',
        content: 'El Valle Sagrado abarca un féretro de tierras fértiles regadas por el río Urubamba. Fue el centro clave de producción agrícola para los incas debido a su microclima templado y suelos ricos.',
        image: `${R2_BASE}/1784875480702-valle-sagrado-1.webp`
      },
      {
        order: 2,
        subtitle: 'Pisac y sus monumentales terrazas agrícolas',
        content: 'El complejo arqueológico de Pisac impresiona por sus terrazas escalonadas en la ladera de la montaña y su famoso mercado artesanal, repleto de textiles, platería y cerámica tradicional.',
        image: `${R2_BASE}/1784875482442-valle-sagrado-2.webp`
      },
      {
        order: 3,
        subtitle: 'Ollantaytambo: La fortaleza viva del imperio',
        content: 'Ollantaytambo es el único pueblo inca que conserva su trazado urbano original. Sus enormes bloques de piedra labrada en el Templo del Sol muestran el asombroso dominio de la ingeniería incaica.',
        image: `${R2_BASE}/1784875484937-valle-sagrado-3.webp`
      }
    ]
  },
  {
    title: 'Waqrapukara: La Fortaleza Inca Escondida en el Cañón del Apurímac',
    slug: 'waqrapukara-fortaleza-inca-escondida-cusco',
    bannerImage: `${R2_BASE}/1784875486698-waqrapukara-banner.webp`,
    metaTitle: 'Waqrapukara: La Fortaleza Inca Alternativa - Agencia de Viajes',
    metaDescription: 'Descubre Waqrapukara, el majestuoso santuario inca erigido al borde de acantilados impresionantes en el cañón del río Apurímac.',
    keywords: 'Waqrapukara, Tour Waqrapukara, Trekking alternativo Cusco, Fortaleza Inca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Un santuario místico con forma de cuernos de piedra',
        content: 'Waqrapukara proviene del quechua "Fortaleza en forma de cuernos". Este impresionante santuario inca se yergue a 4,300 m s. n. m. sobre acantilados verticales que caen directamente hacia el río Apurímac.',
        image: `${R2_BASE}/1784875489294-waqrapukara-1.webp`
      },
      {
        order: 2,
        subtitle: 'Una alternativa de trekking mística y libre de aglomeraciones',
        content: 'Ideal para viajeros experimentados que buscan evitar las rutas masivas. El sendero serpentea por paisajes punenos, lagunas de altura y formaciones rocosas únicas.',
        image: `${R2_BASE}/1784875491655-waqrapukara-2.webp`
      }
    ]
  },
  {
    title: 'Queshuachaca: El Último Puente Inca de Ichu Tejido a Mano',
    slug: 'queshuachaca-ultimo-puente-inca-tejido',
    bannerImage: `${R2_BASE}/1784875494469-queshuachaca-banner.webp`,
    metaTitle: 'Queshuachaca: El Último Puente Inca Vivo - Agencia de Viajes',
    metaDescription: 'Conoce la impresionante historia de Queshuachaca, el último puente colgante de paja trenzada que renace cada año gracias al trabajo comunitario.',
    keywords: 'Queshuachaca, Puente Inca, Tradición Inca Cusco, Qeswachaka',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Una tradición milenaria que desafía al tiempo',
        content: 'Suspendido a 30 metros sobre el río Apurímac, Queshuachaca mide 33 metros de largo y está construido íntegramente de ichu (paja andina). Cada mes de junio, cuatro comunidades locales se unen para renovarlo totalmente.',
        image: `${R2_BASE}/1784875496594-queshuachaca-1.webp`
      },
      {
        order: 2,
        subtitle: 'Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO',
        content: 'El ritual de reconstrucción involucra plegarias a la Pachamama y técnicas prehispánicas transmitidas de generación en generación, demostrando la vigencia de la cultura andina.',
        image: `${R2_BASE}/1784875498448-queshuachaca-2.webp`
      }
    ]
  },
  {
    title: 'Camino Inca vs. Salkantay Trek: ¿Cuál Elegir para tu Aventura a Machu Picchu?',
    slug: 'camino-inca-vs-salkantay-trek-comparativa',
    bannerImage: `${R2_BASE}/1784875500398-camino-inca-vs-salkantay-banner.webp`,
    metaTitle: 'Camino Inca vs Salkantay Trek: Guía Comparativa - Agencia de Viajes',
    metaDescription: 'Comparamos el Camino Inca clásico y la ruta del Salkantay Trek a Machu Picchu: paisajismo, permisos, dificultad y experiencia.',
    keywords: 'Camino Inca, Salkantay Trek, Machu Picchu Trek, Comparativa rutas Machu Picchu',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El Camino Inca Clásico: Historia y exclusividad',
        content: 'El Camino Inca de 4 días atraviesa senderos de piedra auténticos construidos por el imperio incaico y pasa por múltiples ciudadelas antiguas antes de ingresar a Machu Picchu por el Inti Punku (Puerta del Sol). Requiere reservar permisos con meses de anticipación.',
        image: `${R2_BASE}/1784875502760-camino-inca-1.webp`
      },
      {
        order: 2,
        subtitle: 'El Salkantay Trek: Naturaleza salvaje y paisajes glaciares',
        content: 'El Salkantay Trek es reconocido por National Geographic como una de las mejores caminatas del mundo. Recorre pasos nevados a 4,600 metros de altitud y desciende hacia la frondosa selva alta, ofreciendo mayor flexibilidad en reservas.',
        image: `${R2_BASE}/1784875505476-salkantay-trek-1.webp`
      }
    ]
  },
  {
    title: 'Guía Definitiva de Machu Picchu 2026: Nuevos Circuitos, Boletos y Consejos',
    slug: 'machu-picchu-guia-circuitos-2026',
    bannerImage: `${R2_BASE}/1784875478876-valle-sagrado-banner.webp`,
    metaTitle: 'Guía de Circuitos Machu Picchu 2026 - Agencia de Viajes',
    metaDescription: 'Conoce el nuevo sistema de circuitos para visitar Machu Picchu en 2026: rutas panorámicas, realeza y clásicas, horarios de tren y cómo comprar entradas.',
    keywords: 'Machu Picchu 2026, Circuitos Machu Picchu, Entradas Machu Picchu, Guía Machu Picchu Cusco',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El nuevo sistema de circuitos y rutas en la maravilla del mundo',
        content: 'Desde las últimas actualizaciones del Ministerio de Cultura, la visita a Machu Picchu se organiza en circuitos específicos (Circuito Panorámico, Circuito Clásico y Circuito de la Realeza). Cada uno ofrece perspectivas únicas de la ciudadela y senderos adaptados al tiempo y condición física de los visitantes.',
        image: `${R2_BASE}/1784875480702-valle-sagrado-1.webp`
      },
      {
        order: 2,
        subtitle: 'Horarios de tren y traslado hacia Aguas Calientes',
        content: 'Para llegar a Machu Picchu la vía ferroviaria desde Ollantaytambo o Poroy hasta Aguas Calientes es la más cómoda y rápida. Los servicios de tren turístico Expedition, Vistadome y 360° ofrecen ventanas panorámicas para admirar el cambio de la vegetación andina a la selva subtropical.',
        image: `${R2_BASE}/1784875482442-valle-sagrado-2.webp`
      },
      {
        order: 3,
        subtitle: 'Recomendaciones indispensables para tu visita',
        content: 'Es mandatorio llevar tu pasaporte o documento original con el que se realizó la reserva. Te sugerimos portar protector solar, repelente orgánico para insectos, agua en botella reutilizable y calzado con suela antideslizante para los peldaños incas.',
        image: `${R2_BASE}/1784875484937-valle-sagrado-3.webp`
      }
    ]
  },
  {
    title: 'Maras y Moray: Salineras Milenarias y el Laboratorio Agrícola Inca',
    slug: 'maras-moray-salineras-laboratorio-agricola',
    bannerImage: `${R2_BASE}/1784875486698-waqrapukara-banner.webp`,
    metaTitle: 'Tour Maras Moray y Salineras en Cusco - Agencia de Viajes',
    metaDescription: 'Descubre las más de 3,000 pozas de sal artesanal de Maras y las impresionantes terrazas circulares concéntricas de Moray en el Valle Sagrado.',
    keywords: 'Salineras de Maras, Moray Cusco, Laboratorio Inca, Valle Sagrado de los Incas',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Las Salineras de Maras: Más de 3,000 pozas de sal ancestral',
        content: 'Ubicadas en una pendiente del cerro Qaqawiñay, las Salineras de Maras han sido explotadas desde la época preincaica. Un manantial de agua hipersalina subterránea nutre miles de pozas artesanales donde la sal se cristaliza por evaporación solar.',
        image: `${R2_BASE}/1784875489294-waqrapukara-1.webp`
      },
      {
        order: 2,
        subtitle: 'Moray: El fascinante centro de experimentación agrícola inca',
        content: 'Moray está compuesto por gigantescas andenerías circulares concéntricas que generaban microclimas con variaciones de hasta 5°C entre la terraza superior y la más profunda. Los incas utilizaban este espacio para domesticar y adaptar semillas de maíz, papa y quinua provenientes de distintas alturas.',
        image: `${R2_BASE}/1784875491655-waqrapukara-2.webp`
      }
    ]
  },
  {
    title: 'Gastronomía Cusqueña: 7 Platos Típicos y Tradición Culinaria Andina',
    slug: 'gastronomia-cusquena-platos-tipicos-mercados',
    bannerImage: `${R2_BASE}/1784875494469-queshuachaca-banner.webp`,
    metaTitle: 'Gastronomía Cusqueña y Platos Típicos Andinos - Agencia de Viajes',
    metaDescription: 'Explora los sabores auténticos del Cusco: chiriuchu, lechón al horno, trucha frita, sopa de quinua y los mercados tradicionales de San Pedro.',
    keywords: 'Gastronomía Cusqueña, Platos típicos Cusco, Mercado San Pedro Cusco, Chiriuchu',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Una cocina milenaria con identidad de los Andes',
        content: 'La gastronomía tradicional de Cusco es un festín de ingredientes autóctonos: más de 3,000 variedades de papas nativas, maíz gigante de Urubamba, hierbas aromáticas como la muña y el huacatay, y carnes cocinadas lentamente en hornos de leña de adobe.',
        image: `${R2_BASE}/1784875496594-queshuachaca-1.webp`
      },
      {
        order: 2,
        subtitle: 'El emblemático Chiriuchu y los platos festivos',
        content: 'El Chiriuchu (que significa "ají frío") es el plato bandera cusqueño por excelencia durante la fiesta del Corpus Christi, combinando cuy asado, gallina sancochada, chalgua (pescaditos secos), torreja de maíz, queso y cochayuyo (alga marina).',
        image: `${R2_BASE}/1784875498448-queshuachaca-2.webp`
      },
      {
        order: 3,
        subtitle: 'El Mercado Central de San Pedro: El corazón gastronómico',
        content: 'Visitar el Mercado San Pedro es sumergirse en los olores y colores del Cusco real. Desde humeantes caldos de gallina y cordero hasta jugos de frutas exóticas de la selva de La Convención, es una parada obligatoria para el viajero gourmet.',
        image: `${R2_BASE}/1784875463197-laguna-humantay-3.webp`
      }
    ]
  },
  {
    title: 'Choquequirao: La Ciudadela Sagrada y Hermana Secreta de Machu Picchu',
    slug: 'choquequirao-guia-trekking-hermana-machu-picchu',
    bannerImage: `${R2_BASE}/1784875500398-camino-inca-vs-salkantay-banner.webp`,
    metaTitle: 'Choquequirao Trek: La Ciudadela Sagrada Inca - Agencia de Viajes',
    metaDescription: 'Descubre Choquequirao, una de las ciudadelas incas más remotas y majestuosas del Perú. Guía completa de trekking de 4 a 5 días por el Cañón del Apurímac.',
    keywords: 'Choquequirao, Choquequirao Trek, Trekking Cusco, Ciudadela Sagrada Inca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'La última resistencia inca en las profundidades del cañón',
        content: 'Choquequirao ("Cuna de Oro" en quechua) se sitúa a 3,033 m s. n. m. sobre las estribaciones del nevado Salcantay. Fue uno de los últimos bastiones de resistencia incaica y solo el 30% del complejo ha sido excavado hasta la fecha, rodeado de una naturaleza salvaje y casi virgen.',
        image: `${R2_BASE}/1784875502760-camino-inca-1.webp`
      },
      {
        order: 2,
        subtitle: 'El trekking a Choquequirao: Una aventura para auténticos exploradores',
        content: 'A diferencia de Machu Picchu, a Choquequirao solo se puede acceder caminando. La ruta clásica de 4 o 5 días parte de Capuliyoc o Cachora, desciende más de 1,500 metros hasta cruzar el río Apurímac en Playa Rosalina y asciende por la ladera opuesta en un reto físico inolvidable.',
        image: `${R2_BASE}/1784875505476-salkantay-trek-1.webp`
      }
    ]
  }
];

async function main() {
  console.log(`Seeding exactly ${blogsData.length} blog articles with Cloudflare R2 image URLs...`);
  
  for (const b of blogsData) {
    console.log(`Processing blog: ${b.title}`);
    
    await prisma.blog.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        bannerImage: b.bannerImage,
        metaTitle: b.metaTitle,
        metaDescription: b.metaDescription,
        keywords: b.keywords,
        paragraphs: {
          deleteMany: {},
          create: b.paragraphs
        }
      },
      create: {
        title: b.title,
        slug: b.slug,
        bannerImage: b.bannerImage,
        metaTitle: b.metaTitle,
        metaDescription: b.metaDescription,
        keywords: b.keywords,
        paragraphs: {
          create: b.paragraphs
        }
      }
    });
  }

  // Remove any legacy blogs that are not part of the 10 approved articles
  const currentSlugs = blogsData.map(b => b.slug);
  const deleted = await prisma.blog.deleteMany({
    where: {
      slug: { notIn: currentSlugs }
    }
  });
  if (deleted.count > 0) {
    console.log(`Cleaned up ${deleted.count} obsolete blogs.`);
  }

  const finalCount = await prisma.blog.count();
  console.log(`✅ Successfully seeded blogs! Total count in DB: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Error seeding blogs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
