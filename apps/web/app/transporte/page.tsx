import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { prisma, INITIAL_TRANSFERS, INITIAL_VEHICLES } from '@repo/db';
import { TransporteClient } from '@/components/transporte/transporte-client';
import { apiCatalog } from '@/lib/api-catalog';

export const revalidate = 0;

export const metadata = {
  title: 'Traslados y Transporte Turístico en Cusco y Perú | Agencia de Viajes',
  description: 'Reserva traslados seguros y cómodos entre el Aeropuerto de Cusco, Hoteles, Poroy, Ollantaytambo y el Valle Sagrado. Vehículos modernos, chofer profesional y precios transparentes.',
};

export default async function TransportePage() {
  let transfersData: any[] = [];

  // 1. Intento primario vía API central NestJS desacoplada
  try {
    const apiTransfers = apiCatalog.isEnabled() ? await apiCatalog.getTransfers() : [];
    if (apiTransfers && apiTransfers.length > 0) {
      transfersData = apiTransfers.map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        origin: t.origin,
        destination: t.destination,
        duration: t.duration,
        tripType: t.tripType,
        hasSharedService: t.hasSharedService,
        sharedPrice: t.sharedPrice,
        hasPrivateService: t.hasPrivateService,
        vehicles: t.vehicleOptions.map((vp) => ({
          id: vp.id,
          code: vp.vehicleCode,
          name: vp.vehicleName,
          subtitle: vp.subtitle,
          maxPax: vp.maxPax,
          maxLuggage: vp.maxLuggage,
          image: vp.image,
          price: vp.price,
          features: vp.features,
        })),
      }));
    }
  } catch (err) {
    // Continuar a fallback de resiliencia
  }

  // 2. Resiliencia local / fallback seguro a BD directa
  if (!apiCatalog.isEnabled() && transfersData.length === 0) {
    try {
      const dbTransfers = await prisma.transfer.findMany({
        where: { isActive: true, isPublished: true },
        orderBy: { order: 'asc' },
        include: {
          vehiclePrices: {
            include: {
              vehicle: true,
            },
          },
        },
      });

    if (dbTransfers && dbTransfers.length > 0) {
      transfersData = dbTransfers.map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        origin: t.origin,
        destination: t.destination,
        duration: t.duration,
        tripType: t.tripType,
        hasSharedService: t.hasSharedService,
        sharedPrice: t.sharedPrice,
        hasPrivateService: t.hasPrivateService,
        vehicles: t.vehiclePrices.map((vp) => ({
          id: vp.vehicle.id,
          code: vp.vehicle.code,
          name: vp.vehicle.name,
          subtitle: vp.vehicle.subtitle,
          maxPax: vp.vehicle.maxPax,
          maxLuggage: vp.vehicle.maxLuggage,
          image: vp.vehicle.image,
          price: vp.price,
        })),
      }));
    }
  } catch (error) {
    console.error('Error fetching transfers from DB:', error);
  }
}

  // Demo fixtures require explicit local opt-in; drafts never trigger demo publication.
  if (process.env.NODE_ENV !== 'production' && process.env.LEGACY_DEMO_CATALOG === 'true' && !apiCatalog.isEnabled() && transfersData.length === 0) {
    transfersData = INITIAL_TRANSFERS.map((t, idx) => ({
      id: `seed-transfer-${idx}`,
      title: t.title,
      slug: t.slug,
      origin: t.origin,
      destination: t.destination,
      duration: t.duration,
      tripType: t.tripType,
      hasSharedService: t.hasSharedService,
      sharedPrice: t.sharedPrice,
      hasPrivateService: t.hasPrivateService,
      vehicles: INITIAL_VEHICLES.map((v) => ({
        id: `seed-veh-${v.code}`,
        code: v.code,
        name: v.name,
        subtitle: v.subtitle,
        maxPax: v.maxPax,
        maxLuggage: v.maxLuggage,
        image: v.image,
        price: (t.vehiclePrices as any)[v.code] || 20,
        features: v.features,
      })),
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header />

      {/* Hero Section Normalizado */}
      <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/transporte-hero.webp" 
            alt="Transporte y Traslados en Cusco" 
            fill 
            sizes="100vw" 
            className="object-cover" 
            priority 
            unoptimized={true} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        </div>

        <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-white mb-4 drop-shadow-lg leading-tight tracking-tight">
            Transporte y Traslados en Cusco
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
            Viaja seguro y puntual entre aeropuertos, estaciones de tren y hoteles del Valle Sagrado con nuestra moderna flota.
          </p>
        </div>
      </div>

      {/* Main Content with Interactive Client */}
      <main className="flex-1">
        <TransporteClient initialTransfers={transfersData} />
      </main>

      <Footer />
    </div>
  );
}
