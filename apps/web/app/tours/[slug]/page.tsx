import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TourHero } from '@/components/tour/tour-hero';
import { TourTabs } from '@/components/tour/tour-nav';
import { TourBookingCard } from '@/components/tour/tour-booking-card';
import { MapPin, Clock, Mountain, Users, BarChart } from 'lucide-react';
import Image from 'next/image';
import { getTourBySlug } from '@/lib/queries/tour';

export const revalidate = 3600;

interface TourPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: TourPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  if (!slug) {
    return { title: 'Tour no encontrado - Inca Bound' };
  }

  const tour = await getTourBySlug(slug);

  if (!tour) {
    return {
      title: 'Tour no encontrado - Inca Bound',
    };
  }

  const imageUrl = tour.bannerImage || tour.cardImage || '/salkantay.webp';

  return {
    title: tour.metaTitle || `${tour.title} - Inca Bound`,
    description: tour.metaDescription || tour.description.slice(0, 160),
    openGraph: {
      title: tour.title,
      description: tour.description.slice(0, 160),
      images: [
        {
          url: imageUrl,
          alt: tour.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.title,
      description: tour.description.slice(0, 160),
      images: [imageUrl],
    },
  };
}

function formatAltitude(raw: string | null | undefined): string {
  if (!raw) return '3,400 m s. n. m.';
  const cleaned = raw.replace(/m\s*\.?\s*s\s*\.?\s*n\s*\.?\s*m\s*\.?/gi, '').replace(/\s*m\b/gi, '').trim();
  const match = cleaned.match(/[\d.,]+/);
  if (!match) return `${raw} m s. n. m.`;

  let numStr = match[0];
  if (/^\d{4,}$/.test(numStr)) {
    numStr = parseInt(numStr, 10).toLocaleString('en-US');
  }

  return `${numStr} m s. n. m.`;
}

function formatGroupSize(raw: string | null | undefined): string {
  if (!raw) return 'Hasta 15 personas';
  const match = raw.match(/\d+/);
  if (match) {
    return `Hasta ${match[0]} personas`;
  }
  return raw.startsWith('Hasta') ? raw : `Hasta ${raw}`;
}

export default async function TourPage({ params }: TourPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';
  if (!slug) {
    notFound();
  }

  // Buscar el tour deduplicado con React.cache()
  const tour = await getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const rawImage = tour.bannerImage || tour.cardImage || '';
  const isValidImage = rawImage && !rawImage.includes('/tours/default-') && (rawImage.startsWith('http') || rawImage.startsWith('/uploads') || rawImage.startsWith('/salkantay') || rawImage.startsWith('data:image'));
  const heroImage = isValidImage ? rawImage : null;

  // Mapear los datos de la BD para los componentes de la vista
  const formattedTour = {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    image: heroImage,
    price: tour.sharedPrice || 0,
    hasSharedService: tour.hasSharedService,
    hasPrivateService: tour.hasPrivateService,
    privatePricing: tour.privatePricing?.map(p => ({ pax: p.pax, price: p.price })) || [],
    privatePrice: tour.privatePricing?.[0]?.price || null,
    duration: tour.duration || 'Por consultar',
    difficulty: tour.difficulty || 'Moderada',
    groupSize: formatGroupSize(tour.groupSize),
    maxAltitude: formatAltitude(tour.altitude),
    overview: tour.description,
    mapImage: tour.mapImage,
    itinerary: tour.itineraries.map((it, idx) => ({
      day: idx + 1,
      title: it.title,
      description: it.content,
      details: []
    })),
    inclusions: tour.inclusions.map(i => i.content),
    exclusions: tour.exclusions.map(e => e.content),
    recommendations: tour.recommendations.map(r => r.content),
    faqs: tour.faqs.map(f => ({ question: f.question, answer: f.answer })),
    images: tour.images.map(img => img.url)
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristTrip',
        '@id': `https://incabound.com/tours/${tour.slug}#trip`,
        name: tour.title,
        description: tour.description.slice(0, 300),
        image: isValidImage ? [rawImage] : ['https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/Hero-Home.webp'],
        touristType: ['AdventureTourism', 'CulturalTourism'],
        provider: {
          '@type': 'TravelAgency',
          name: 'Inca Bound',
          url: 'https://incabound.com',
        },
        offers: {
          '@type': 'Offer',
          price: tour.sharedPrice || 0,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `https://incabound.com/tours/${tour.slug}`,
        },
        ...(tour.itineraries.length > 0 ? {
          itinerary: {
            '@type': 'ItemList',
            itemListElement: tour.itineraries.map((it, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: it.title,
              description: it.content,
            })),
          }
        } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: 'https://incabound.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tours',
            item: 'https://incabound.com/tours',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tour.title,
            item: `https://incabound.com/tours/${tour.slug}`,
          },
        ],
      },
      ...(tour.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: tour.faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      <main className="flex-1">
        <TourHero tour={formattedTour} />

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
                        <p className="text-sm text-gray-500">{formattedTour.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <BarChart size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Dificultad</p>
                        <p className="text-sm text-gray-500">{formattedTour.difficulty}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <Users size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Tamaño de Grupo</p>
                        <p className="text-sm text-gray-500">{formattedTour.groupSize}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="shrink-0 text-[#062918]">
                        <Mountain size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm text-[#062918] font-bold tracking-tight mb-0.5">Altitud Max</p>
                        <p className="text-sm text-gray-500">{formattedTour.maxAltitude}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción del Tour */}
                <div className="mb-10">
                  <p className="text-gray-600 text-[17px] leading-relaxed whitespace-pre-line">
                    {formattedTour.overview}
                  </p>
                </div>

                {/* Componente de Tabs (Itinerario, Inclusiones, Recomendaciones, FAQs, Galería) */}
                <TourTabs tour={formattedTour} />
              </section>

            </div>

            {/* Columna Derecha: Sticky Booking Box (30%) */}
            <div className="w-full lg:w-1/3 sticky top-32 flex flex-col gap-8">
              {/* Mapa de la Ruta si existe */}
              {formattedTour.mapImage ? (
                <div className="w-full h-[250px] rounded-2xl overflow-hidden shadow-md relative border border-gray-200">
                  <Image src={formattedTour.mapImage} alt={`Mapa de ${formattedTour.title}`} fill sizes="(max-width: 1024px) 100vw, 380px" className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-[250px] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 border border-gray-200 relative overflow-hidden">
                  <MapPin size={48} className="mb-4 text-gray-300" />
                  <span className="font-medium">Mapa de ruta disponible al reservar</span>
                </div>
              )}
              
              <TourBookingCard 
                tourTitle={formattedTour.title}
                slug={formattedTour.slug}
                price={formattedTour.price} 
                hasSharedService={formattedTour.hasSharedService}
                hasPrivateService={formattedTour.hasPrivateService}
                privatePricing={formattedTour.privatePricing}
                image={formattedTour.image}
              />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
