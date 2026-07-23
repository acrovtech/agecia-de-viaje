import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const blogsData = [
  {
    title: 'Guía Completa para Visitar la Laguna Humantay en 2026: Consejos, Altitud y Clima',
    slug: 'guia-visitar-laguna-humantay',
    bannerImage: '/blogs/laguna-humantay-banner.webp',
    metaTitle: 'Guía para Visitar la Laguna Humantay - Inca Bound',
    metaDescription: 'Descubre cómo preparar tu excursión a la Laguna Humantay a 4,200 m.n.m. Consejos de aclimatación, mejor época para viajar y qué llevar.',
    keywords: 'Laguna Humantay, Tour Humantay, Caminata Humantay Cusco, Altitud Humantay',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Una joya turquesa a los pies del Nevado Salkantay',
        content: 'La Laguna Humantay es uno de los destinos paisajísticos más impactantes de la región del Cusco. Ubicada a 4,200 metros sobre el nivel del mar, esta impresionante laguna de aguas turquesas se alimenta del deshielo del majestuoso nevado Humantay. Su color vibrante varía según la luz del sol, creando un espectáculo natural inolvidable.',
        image: '/blogs/laguna-humantay-1.webp'
      },
      {
        order: 2,
        subtitle: '¿Cómo llegar y cuál es el nivel de dificultad?',
        content: 'El recorrido inicia temprano en la ciudad del Cusco con un viaje en transporte de aproximadamente 3 horas hacia Mollepata y Challacancha. Desde allí, comienza una caminata ascendente de unos 3.5 kilómetros. Aunque la distancia es corta, la altitud y la inclinación del terreno hacen que la exigencia sea moderada a alta. Es fundamental caminar a un ritmo constante y llevar bastones de trekking.',
        image: '/blogs/laguna-humantay-2.webp'
      },
      {
        order: 3,
        subtitle: 'Consejos de aclimatación y equipamiento esencial',
        content: 'Recomendamos estar en Cusco al menos 2 días antes de realizar el tour para aclimatar tu cuerpo a la altura. Lleva ropa en capas (abrigo cortaviento, casaca térmica), protector solar, agua, hojas de coca o muña para el soroche, y calzado de montaña con buen agarre.',
        image: '/blogs/laguna-humantay-3.webp'
      }
    ]
  },
  {
    title: 'Montaña de 7 Colores (Vinicunca): Todo lo que Debes Saber Antes de tu Viaje',
    slug: 'montana-de-7-colores-vinicunca-guia-viaje',
    bannerImage: '/blogs/vinicunca-banner.webp',
    metaTitle: 'Guía de Viaje Montaña de 7 Colores Vinicunca - Inca Bound',
    metaDescription: 'Información esencial para conocer la famosa Montaña de Colores Vinicunca en Cusco. Consejos de altura, clima y recomendaciones de vestimenta.',
    keywords: 'Montaña de 7 Colores, Vinicunca, Rainbow Mountain Cusco, Tour Vinicunca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El arcoíris terrestre de los Andes peruanos',
        content: 'Conocida mundialmente como la Montaña Arcoíris o Vinicunca, esta maravilla geológica debe sus franjas de tonos rojizos, amarillos, morados y dorados a la oxidación de minerales marinos y continentales depositados durante millones de años.',
        image: '/blogs/vinicunca-1.webp'
      },
      {
        order: 2,
        subtitle: 'Ubicación y altura máxima de la cima',
        content: 'Situada en la cordillera del Vilcanota a 5,200 metros de altitud, Vinicunca exige una preparación adecuada. El frío y el viento en la cumbre son intensos, por lo que vestir prendas abrigadoras e impermeables es indispensable.',
        image: '/blogs/vinicunca-2.webp'
      },
      {
        order: 3,
        subtitle: 'La mejor época para contemplar sus colores deslumbrantes',
        content: 'La época seca, entre los meses de abril y noviembre, ofrece días despejados con cielos celestes brillantes que resaltan los pigmentos naturales de la montaña en todo su esplendor.',
        image: '/blogs/vinicunca-3.webp'
      }
    ]
  },
  {
    title: 'Valle Sagrado de los Incas: Pisac, Ollantaytambo y Chinchero en 1 Día',
    slug: 'valle-sagrado-incas-pisac-ollantaytambo-chinchero',
    bannerImage: '/blogs/valle-sagrado-banner.webp',
    metaTitle: 'Tour Valle Sagrado de los Incas: Pisac y Ollantaytambo - Inca Bound',
    metaDescription: 'Explora la historia, andenerías y arquitectura viva del Valle Sagrado de los Incas. Una guía completa por Pisac, Ollantaytambo y Chinchero.',
    keywords: 'Valle Sagrado Cusco, Pisac Ollantaytambo, Tour Valle Sagrado, Arqueologia Inca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El corazón agrícola y espiritual del Imperio Inca',
        content: 'El Valle Sagrado abarca un féretro de tierras fértiles regadas por el río Urubamba. Fue el centro clave de producción agrícola para los incas debido a su microclima templado y suelos ricos.',
        image: '/blogs/valle-sagrado-1.webp'
      },
      {
        order: 2,
        subtitle: 'Pisac y sus monumentales terrazas agrícolas',
        content: 'El complejo arqueológico de Pisac impresiona por sus terrazas escalonadas en la ladera de la montaña y su famoso mercado artesanal, repleto de textiles, platería y cerámica tradicional.',
        image: '/blogs/valle-sagrado-2.webp'
      },
      {
        order: 3,
        subtitle: 'Ollantaytambo: La fortaleza viva del imperio',
        content: 'Ollantaytambo es el único pueblo inca que conserva su trazado urbano original. Sus enormes bloques de piedra labrada en el Templo del Sol muestran el asombroso dominio de la ingeniería incaica.',
        image: '/blogs/valle-sagrado-3.webp'
      }
    ]
  },
  {
    title: 'Waqrapukara: La Fortaleza Inca Escondida en el Cañón del Apurímac',
    slug: 'waqrapukara-fortaleza-inca-escondida-cusco',
    bannerImage: '/blogs/waqrapukara-banner.webp',
    metaTitle: 'Waqrapukara: La Fortaleza Inca Alternativa - Inca Bound',
    metaDescription: 'Descubre Waqrapukara, el majestuoso santuario inca erigido al borde de acantilados impresionantes en el cañón del río Apurímac.',
    keywords: 'Waqrapukara, Tour Waqrapukara, Trekking alternativo Cusco, Fortaleza Inca',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Un santuario místico con forma de cuernos de piedra',
        content: 'Waqrapukara proviene del quechua "Fortaleza en forma de cuernos". Este impresionante santuario inca se yergue a 4,300 m s. n. m. sobre acantilados verticales que caen directamente hacia el río Apurímac.',
        image: '/blogs/waqrapukara-1.webp'
      },
      {
        order: 2,
        subtitle: 'Una alternativa de trekking mística y libre de aglomeraciones',
        content: 'Ideal para viajeros experimentados que buscan evitar las rutas masivas. El sendero serpentea por paisajes punenos, lagunas de altura y formaciones rocosas únicas.',
        image: '/blogs/waqrapukara-2.webp'
      }
    ]
  },
  {
    title: 'Queshuachaca: El Último Puente Inca de Ichu Tejido a Mano',
    slug: 'queshuachaca-ultimo-puente-inca-tejido',
    bannerImage: '/blogs/queshuachaca-banner.webp',
    metaTitle: 'Queshuachaca: El Último Puente Inca Vivo - Inca Bound',
    metaDescription: 'Conoce la impresionante historia de Queshuachaca, el último puente colgante de paja trenzada que renace cada año gracias al trabajo comunitario.',
    keywords: 'Queshuachaca, Puente Inca, Tradición Inca Cusco, Qeswachaka',
    paragraphs: [
      {
        order: 1,
        subtitle: 'Una tradición milenaria que desafía al tiempo',
        content: 'Suspendido a 30 metros sobre el río Apurímac, Queshuachaca mide 33 metros de largo y está construido íntegramente de ichu (paja andina). Cada mes de junio, cuatro comunidades locales se unen para renovarlo totalmente.',
        image: '/blogs/queshuachaca-1.webp'
      },
      {
        order: 2,
        subtitle: 'Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO',
        content: 'El ritual de reconstrucción involucra plegarias a la Pachamama y técnicas prehispánicas transmitidas de generación en generación, demostrando la vigencia de la cultura andina.',
        image: '/blogs/queshuachaca-2.webp'
      }
    ]
  },
  {
    title: 'Camino Inca vs. Salkantay Trek: ¿Cuál Elegir para tu Aventura a Machu Picchu?',
    slug: 'camino-inca-vs-salkantay-trek-comparativa',
    bannerImage: '/blogs/camino-inca-vs-salkantay-banner.webp',
    metaTitle: 'Camino Inca vs Salkantay Trek: Guía Comparativa - Inca Bound',
    metaDescription: 'Comparamos el Camino Inca clásico y la ruta del Salkantay Trek a Machu Picchu: paisajismo, permisos, dificultad y experiencia.',
    keywords: 'Camino Inca, Salkantay Trek, Machu Picchu Trek, Comparativa rutas Machu Picchu',
    paragraphs: [
      {
        order: 1,
        subtitle: 'El Camino Inca Clásico: Historia y exclusividad',
        content: 'El Camino Inca de 4 días atraviesa senderos de piedra auténticos construidos por el imperio incaico y pasa por múltiples ciudadelas antiguas antes de ingresar a Machu Picchu por el Inti Punku (Puerta del Sol). Requiere reservar permisos con meses de anticipación.',
        image: '/blogs/camino-inca-1.webp'
      },
      {
        order: 2,
        subtitle: 'El Salkantay Trek: Naturaleza salvaje y paisajes glaciares',
        content: 'El Salkantay Trek es reconocido por National Geographic como una de las mejores caminatas del mundo. Recorre pasos nevados a 4,600 metros de altitud y desciende hacia la frondosa selva alta, ofreciendo mayor flexibilidad en reservas.',
        image: '/blogs/salkantay-trek-1.webp'
      }
    ]
  }
];

async function main() {
  console.log('Seeding 6 blog articles...');
  
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

  console.log('Successfully seeded 6 blog articles!');
}

main()
  .catch((e) => {
    console.error('Error seeding blogs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
