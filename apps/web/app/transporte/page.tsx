import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import { prisma, INITIAL_TRANSFERS, INITIAL_VEHICLES } from '@repo/db';
import { TransporteClient } from '@/components/transporte/transporte-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Traslados y Transporte Turístico en Cusco y Perú | IncaBound',
  description: 'Reserva traslados seguros y cómodos entre el Aeropuerto de Cusco, Hoteles, Poroy, Ollantaytambo y el Valle Sagrado. Vehículos modernos, chofer profesional y precios transparentes.',
};

export default async function TransportePage() {
  let transfersData: any[] = [];

  try {
    const dbTransfers = await prisma.transfer.findMany({
      where: { isActive: true },
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
          features: vp.vehicle.features,
        })),
      }));
    }
  } catch (error) {
    console.error('Error fetching transfers from DB:', error);
  }

  // Fallback to rich seed structure if DB is empty or during local setup
  if (transfersData.length === 0) {
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
      <div className="relative h-[80dvh] min-h-[500px] w-full bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/transporte-hero.webp')] bg-cover bg-center opacity-60" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
            Transporte y Traslados en Cusco
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
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
