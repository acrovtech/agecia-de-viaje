import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Generando datos de prueba para Reservas y Campañas de Marketing...");

  // 1. Obtener tours disponibles
  const availableTours = await prisma.tour.findMany({
    take: 10,
    select: { id: true, title: true, slug: true, sharedPrice: true }
  });

  // 2. Obtener traslados y tipos de vehículos disponibles
  const availableTransfers = await prisma.transfer.findMany({
    include: {
      vehiclePrices: {
        include: { vehicle: true }
      }
    }
  });

  const availableVehicles = await prisma.vehicleType.findMany();

  console.log(`ℹ️ Tours encontrados: ${availableTours.length}`);
  console.log(`ℹ️ Traslados encontrados: ${availableTransfers.length}`);
  console.log(`ℹ️ Tipos de vehículo encontrados: ${availableVehicles.length}`);

  const getTourBySlug = (slugPart: string) => 
    availableTours.find(t => t.slug.includes(slugPart)) || availableTours[0] || null;

  const getTransferBySlug = (slugPart: string) => 
    availableTransfers.find(t => t.slug.includes(slugPart)) || availableTransfers[0] || null;

  const getVehicleByCode = (code: string) => 
    availableVehicles.find(v => v.code === code) || availableVehicles[0] || null;

  // Limpiar reservas de prueba previas para no duplicar indefinidamente
  await prisma.reservationPassenger.deleteMany({});
  await prisma.reservationItem.deleteMany({});
  await prisma.reservation.deleteMany({});
  await (prisma as any).marketingCampaignLog.deleteMany({});

  const reservationsData = [
    // 1. Michael Brown (Cliente Recurrente con Atribución MK1)
    {
      customerFirstName: "Michael",
      customerLastName: "Brown",
      customerEmail: "mbrown.travels@yahoo.com",
      customerPhone: "+1 (312) 555-0192",
      date: new Date("2026-09-15T14:30:00Z"),
      pax: 2,
      serviceType: "private",
      totalPrice: 20.00,
      pickupHotel: "Hotel JW Marriott El Convento Cusco",
      pickupTime: "02:15 PM (Vuelo LATAM LA2041)",
      specialRequirements: "Llegan con 2 maletas grandes. Conductor con cartel 'Michael Brown'.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-8841029481-USD",
      type: 'TRANSFER',
      transferSlug: "aeropuerto-cusco-hotel-cusco",
      vehicleCode: "sedan",
      marketingCode: null,
      source: "WEB",
      passengers: [
        { firstName: "Michael", lastName: "Brown", docType: "Pasaporte", docNumber: "US58492019" },
        { firstName: "Jessica", lastName: "Brown", docType: "Pasaporte", docNumber: "US49201948" },
      ]
    },
    {
      customerFirstName: "Michael",
      customerLastName: "Brown",
      customerEmail: "mbrown.travels@yahoo.com",
      customerPhone: "+1 (312) 555-0192",
      date: new Date("2026-09-18T05:00:00Z"),
      pax: 2,
      serviceType: "private",
      totalPrice: 500.00,
      pickupHotel: "Hotel JW Marriott El Convento Cusco",
      pickupTime: "04:30 AM",
      specialRequirements: "Reserva manual coordinada por WhatsApp con descuento promocional.",
      status: ReservationStatus.PAID,
      paymentReference: "MANUAL-WA-8831",
      type: 'TOUR',
      tourSlug: "machu-picchu",
      marketingCode: "MK1",
      source: "WHATSAPP",
      passengers: [
        { firstName: "Michael", lastName: "Brown", docType: "Pasaporte", docNumber: "US58492019" },
        { firstName: "Jessica", lastName: "Brown", docType: "Pasaporte", docNumber: "US49201948" },
      ]
    },
    // 2. Sebastián Gómez (Cliente con Tour de Laguna Humantay)
    {
      customerFirstName: "Sebastián",
      customerLastName: "Gómez Arango",
      customerEmail: "sgomez@antioquia-tours.co",
      customerPhone: "+57 310 987 6543",
      date: new Date("2026-09-17T09:00:00Z"),
      pax: 5,
      serviceType: "private",
      totalPrice: 25.00,
      pickupHotel: "Palacio del Inka Cusco",
      pickupTime: "06:30 AM (Vuelo Avianca)",
      specialRequirements: "Traslado de salida al aeropuerto.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-7749201948-USD",
      type: 'TRANSFER',
      transferSlug: "hotel-cusco-aeropuerto-cusco",
      vehicleCode: "minivan",
      marketingCode: null,
      source: "WEB",
      passengers: [
        { firstName: "Sebastián", lastName: "Gómez Arango", docType: "Pasaporte", docNumber: "CO18492019" },
        { firstName: "Catalina", lastName: "Mejía", docType: "Pasaporte", docNumber: "CO28491029" },
      ]
    },
    {
      customerFirstName: "Sebastián",
      customerLastName: "Gómez Arango",
      customerEmail: "sgomez@antioquia-tours.co",
      customerPhone: "+57 310 987 6543",
      date: new Date("2026-09-21T04:30:00Z"),
      pax: 5,
      serviceType: "shared",
      totalPrice: 400.00,
      pickupHotel: "Palacio del Inka Cusco",
      pickupTime: "04:15 AM",
      specialRequirements: "Caminata con bastones incluidos.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-9948192019-USD",
      type: 'TOUR',
      tourSlug: "laguna-humantay",
      marketingCode: null,
      source: "WEB",
      passengers: [
        { firstName: "Sebastián", lastName: "Gómez Arango", docType: "Pasaporte", docNumber: "CO18492019" },
      ]
    },
    // 3. Markus Steiner (Grupo de Suiza - Tour Ausangate)
    {
      customerFirstName: "Markus",
      customerLastName: "Steiner",
      customerEmail: "markus.steiner@alpenverein.ch",
      customerPhone: "+41 79 123 4567",
      date: new Date("2026-09-20T06:00:00Z"),
      pax: 8,
      serviceType: "private",
      totalPrice: 640.00,
      pickupHotel: "Sonesta Hotel Cusco (Av. El Sol)",
      pickupTime: "05:30 AM",
      specialRequirements: "Grupo de trekking con mochilas técnicas. Requiere guía bilingüe alemán/inglés.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-3392019482-USD",
      type: 'TOUR',
      tourSlug: "glaciares-de-ausangate-y-4-lagunas",
      marketingCode: "MK2",
      source: "WHATSAPP",
      passengers: [
        { firstName: "Markus", lastName: "Steiner", docType: "Pasaporte", docNumber: "CH88492019" },
        { firstName: "Ursula", lastName: "Steiner", docType: "Pasaporte", docNumber: "CH77492019" },
      ]
    },
    // 4. Alejandro Morales (Cliente Nacional - Traslado Ollantaytambo)
    {
      customerFirstName: "Alejandro",
      customerLastName: "Morales Pineda",
      customerEmail: "amorales@speedy.com.pe",
      customerPhone: "+51 998 765 432",
      date: new Date("2026-09-24T18:00:00Z"),
      pax: 3,
      serviceType: "private",
      totalPrice: 45.00,
      pickupHotel: "Casa Andina Standard Cusco San Blas",
      pickupTime: "06:15 PM (Llegada tren PeruRail)",
      specialRequirements: "Conductor debe esperar con letrero en la salida de la estación.",
      status: ReservationStatus.PENDING,
      paymentReference: null,
      type: 'TRANSFER',
      transferSlug: "estacion-ollantaytambo-cusco",
      vehicleCode: "sedan",
      marketingCode: null,
      source: "MANUAL",
      passengers: [
        { firstName: "Alejandro", lastName: "Morales Pineda", docType: "DNI", docNumber: "45892019" },
      ]
    },
    // 5. David Wilson (Australia - Vinicunca)
    {
      customerFirstName: "David",
      customerLastName: "Wilson",
      customerEmail: "dwilson@sydney-adventure.au",
      customerPhone: "+61 412 345 678",
      date: new Date("2026-09-27T04:00:00Z"),
      pax: 1,
      serviceType: "shared",
      totalPrice: 80.00,
      pickupHotel: "Antigua Casona San Blas",
      pickupTime: "04:15 AM",
      specialRequirements: "Dieta vegetariana para el desayuno y almuerzo buffet.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-1029481920-USD",
      type: 'TOUR',
      tourSlug: "montana-de-colores-vinicunca",
      marketingCode: null,
      source: "WEB",
      passengers: [
        { firstName: "David", lastName: "Wilson", docType: "Pasaporte", docNumber: "AU98492019" },
      ]
    },
    // 6. Elena Rostova (Rusia - Valle Sagrado VIP)
    {
      customerFirstName: "Elena",
      customerLastName: "Rostova",
      customerEmail: "elena.rostova@yandex.ru",
      customerPhone: "+7 916 555 4321",
      date: new Date("2026-09-29T07:30:00Z"),
      pax: 2,
      serviceType: "shared",
      totalPrice: 120.00,
      pickupHotel: "Monasterio, A Belmond Hotel, Cusco",
      pickupTime: "07:45 AM",
      specialRequirements: "Interesada en fotografía textil en Chinchero.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-4458192019-USD",
      type: 'TOUR',
      tourSlug: "valle-sagrado-vip",
      marketingCode: "MK1",
      source: "WHATSAPP",
      passengers: [
        { firstName: "Elena", lastName: "Rostova", docType: "Pasaporte", docNumber: "RU78491029" },
        { firstName: "Dmitry", lastName: "Rostov", docType: "Pasaporte", docNumber: "RU66492019" },
      ]
    }
  ];

  for (const data of reservationsData) {
    const tr = data.type === 'TRANSFER' && data.transferSlug ? getTransferBySlug(data.transferSlug) : null;
    const veh = data.type === 'TRANSFER' && data.vehicleCode ? getVehicleByCode(data.vehicleCode) : null;
    const tour = data.type === 'TOUR' && data.tourSlug ? getTourBySlug(data.tourSlug) : null;

    const created = await (prisma.reservation as any).create({
      data: {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        date: data.date,
        pax: data.pax,
        serviceType: data.serviceType,
        totalPrice: data.totalPrice,
        pickupHotel: data.pickupHotel,
        pickupTime: data.pickupTime,
        specialRequirements: data.specialRequirements,
        status: data.status,
        paymentReference: data.paymentReference,
        marketingCode: data.marketingCode,
        source: data.source,
        tourId: tour ? tour.id : undefined,
        transferId: tr ? tr.id : undefined,
        vehicleTypeId: veh ? veh.id : undefined,
        passengers: {
          create: data.passengers
        }
      }
    });

    const label = tour ? `TOUR [${tour.title}]` : `TRASLADO [${tr?.title || 'Transfer'}]`;
    const mkTag = data.marketingCode ? ` [MK: ${data.marketingCode}]` : '';
    console.log(`✅ Creada reserva: #${created.code} - ${data.customerFirstName} ${data.customerLastName} ${label}${mkTag} - (${data.status})`);
  }

  // 3. Crear logs de campañas de Email Marketing para contrastar la atribución
  await (prisma as any).marketingCampaignLog.createMany({
    data: [
      {
        customerEmail: "mbrown.travels@yahoo.com",
        campaignCode: "MK1",
        subject: "Descuento Exclusivo 10% en Machu Picchu Full Day",
        message: "Hola Michael, esperamos que disfrutes tu estadía en Cusco. Te enviamos una tarifa especial para visitar la ciudadela incaica.",
        flyerUrl: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875478876-valle-sagrado-banner.webp",
        whatsappUrl: "https://wa.me/51984555777?text=Hola!%20Deseo%20reservar%20Machu%20Picchu%20con%20el%20código%20MK1",
        sentByEmail: "marketing@agenciadeviajes.com",
        createdAt: new Date("2026-09-10T15:00:00Z"),
      },
      {
        customerEmail: "elena.rostova@yandex.ru",
        campaignCode: "MK1",
        subject: "Promoción Valle Sagrado VIP de Primavera",
        message: "Estimada Elena, disfruta de los paisajes y talleres de Chinchero y Ollantaytambo con guía VIP.",
        flyerUrl: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/blogs/1784875486698-waqrapukara-banner.webp",
        whatsappUrl: "https://wa.me/51984555777?text=Hola!%20Vengo%20del%20correo%20del%20Valle%20Sagrado%20con%20código%20MK1",
        sentByEmail: "marketing@agenciadeviajes.com",
        createdAt: new Date("2026-09-12T11:30:00Z"),
      }
    ]
  });

  const finalResCount = await prisma.reservation.count();
  const finalLogsCount = await (prisma as any).marketingCampaignLog.count();
  console.log(`🎉 Seed finalizado: ${finalResCount} reservas y ${finalLogsCount} campañas de marketing registradas.`);
}

main()
  .catch(e => {
    console.error("❌ Error en seed-reservas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
