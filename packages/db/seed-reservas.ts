import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Generando datos de prueba para Reservas de Tours y Traslados...");

  // 1. Obtener tours disponibles
  const availableTours = await prisma.tour.findMany({
    take: 10,
    select: { id: true, title: true, sharedPrice: true }
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

  // Helpers para buscar transfer y vehículo
  const getTransferBySlug = (slugPart: string) => 
    availableTransfers.find(t => t.slug.includes(slugPart)) || availableTransfers[0] || null;

  const getVehicleByCode = (code: string) => 
    availableVehicles.find(v => v.code === code) || availableVehicles[0] || null;

  const transferReservations = [
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
      specialRequirements: "Llegan con 2 maletas grandes de 23kg y carry-ons. Conductor con cartel 'Michael Brown'.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-8841029481-USD",
      transferSlug: "aeropuerto-cusco-hotel-cusco",
      vehicleCode: "sedan",
      passengers: [
        { firstName: "Michael", lastName: "Brown", docType: "Pasaporte", docNumber: "US58492019" },
        { firstName: "Jessica", lastName: "Brown", docType: "Pasaporte", docNumber: "US49201948" },
      ]
    },
    {
      customerFirstName: "Sebastián",
      customerLastName: "Gómez Arango",
      customerEmail: "sgomez@antioquia-tours.co",
      customerPhone: "+57 310 987 6543",
      date: new Date("2026-09-17T09:00:00Z"),
      pax: 5,
      serviceType: "private",
      totalPrice: 25.00,
      pickupHotel: "Palacio del Inka, Luxury Collection Hotel",
      pickupTime: "06:30 AM (Vuelo Avianca AV145 sale 09:10 AM)",
      specialRequirements: "Traslado de salida al aeropuerto. Salir puntual por trámites de aduana.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-7749201948-USD",
      transferSlug: "hotel-cusco-aeropuerto-cusco",
      vehicleCode: "minivan",
      passengers: [
        { firstName: "Sebastián", lastName: "Gómez Arango", docType: "Pasaporte", docNumber: "CO18492019" },
        { firstName: "Catalina", lastName: "Mejía Restrepo", docType: "Pasaporte", docNumber: "CO28491029" },
        { firstName: "Mateo", lastName: "Gómez Mejía", docType: "Pasaporte", docNumber: "CO39482019" },
        { firstName: "Sofía", lastName: "Gómez Mejía", docType: "Pasaporte", docNumber: "CO49201948" },
        { firstName: "Ligia", lastName: "Arango de Gómez", docType: "Pasaporte", docNumber: "CO09482019" },
      ]
    },
    {
      customerFirstName: "Markus",
      customerLastName: "Steiner",
      customerEmail: "markus.steiner@alpenverein.ch",
      customerPhone: "+41 79 123 4567",
      date: new Date("2026-09-20T06:00:00Z"),
      pax: 8,
      serviceType: "private",
      totalPrice: 85.00,
      pickupHotel: "Sonesta Hotel Cusco (Av. El Sol)",
      pickupTime: "05:45 AM (Tren Inca Rail a Machu Picchu 08:30 AM)",
      specialRequirements: "Grupo de trekking con mochilas técnicas. Desean vehículo amplio con maletero espacioso.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-3392019482-USD",
      transferSlug: "cusco-ollantaytambo",
      vehicleCode: "benz-10",
      passengers: [
        { firstName: "Markus", lastName: "Steiner", docType: "Pasaporte", docNumber: "CH88492019" },
        { firstName: "Ursula", lastName: "Steiner", docType: "Pasaporte", docNumber: "CH77492019" },
        { firstName: "Stefan", lastName: "Brunner", docType: "Pasaporte", docNumber: "CH66492019" },
        { firstName: "Monika", lastName: "Brunner", docType: "Pasaporte", docNumber: "CH55492019" },
        { firstName: "Reto", lastName: "Keller", docType: "Pasaporte", docNumber: "CH44492019" },
        { firstName: "Brigitte", lastName: "Keller", docType: "Pasaporte", docNumber: "CH33492019" },
        { firstName: "Andreas", lastName: "Lüthi", docType: "Pasaporte", docNumber: "CH22492019" },
        { firstName: "Daniela", lastName: "Lüthi", docType: "Pasaporte", docNumber: "CH11492019" },
      ]
    },
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
      pickupTime: "06:15 PM (Llegada tren PeruRail Voyager)",
      specialRequirements: "Conductor debe esperar con letrero en la salida de la estación de trenes de Ollantaytambo.",
      status: ReservationStatus.PENDING,
      paymentReference: null,
      transferSlug: "ollantaytambo-cusco",
      vehicleCode: "sedan",
      passengers: [
        { firstName: "Alejandro", lastName: "Morales Pineda", docType: "DNI", docNumber: "45892019" },
        { firstName: "Carla", lastName: "Guillén Benavides", docType: "DNI", docNumber: "46781029" },
        { firstName: "Nicolás", lastName: "Morales Guillén", docType: "DNI", docNumber: "78492019" },
      ]
    },
    {
      customerFirstName: "David",
      customerLastName: "Wilson",
      customerEmail: "dwilson@sydney-adventure.au",
      customerPhone: "+61 412 345 678",
      date: new Date("2026-09-27T16:00:00Z"),
      pax: 1,
      serviceType: "private",
      totalPrice: 20.00,
      pickupHotel: "Antigua Casona San Blas",
      pickupTime: "03:45 PM (Vuelo SKY H25021)",
      specialRequirements: "Cancelado porque aerolínea canceló conexión Lima-Cusco por mal clima.",
      status: ReservationStatus.CANCELLED,
      paymentReference: "IZI-TR-1029481920-USD",
      transferSlug: "aeropuerto-cusco-hotel-cusco",
      vehicleCode: "sedan",
      passengers: [
        { firstName: "David", lastName: "Wilson", docType: "Pasaporte", docNumber: "AU98492019" },
      ]
    },
    {
      customerFirstName: "Grupo Corporativo Minero",
      customerLastName: "Chirinos",
      customerEmail: "administracion@corp-andes.pe",
      customerPhone: "+51 984 555 777",
      date: new Date("2026-10-02T10:30:00Z"),
      pax: 12,
      serviceType: "private",
      totalPrice: 120.00,
      pickupHotel: "Hilton Garden Inn Cusco",
      pickupTime: "10:15 AM (Aeropuerto Alejandro Velasco Astete)",
      specialRequirements: "Delegación empresarial de 12 ejecutivos. Traslado privado en van turística de 15 pasajeros.",
      status: ReservationStatus.PAID,
      paymentReference: "IZI-TR-9948201948-USD",
      transferSlug: "aeropuerto-cusco-hotel-cusco",
      vehicleCode: "benz-15",
      passengers: [
        { firstName: "Roberto", lastName: "Chirinos Paz", docType: "DNI", docNumber: "10294819" },
        { firstName: "Carmen", lastName: "Vargas Llosa", docType: "DNI", docNumber: "29481029" },
        { firstName: "Jorge", lastName: "Flores Arana", docType: "DNI", docNumber: "09482910" },
        { firstName: "Susana", lastName: "Vega Rivas", docType: "DNI", docNumber: "40294819" },
      ]
    }
  ];

  for (const data of transferReservations) {
    const tr = getTransferBySlug(data.transferSlug);
    const veh = getVehicleByCode(data.vehicleCode);

    const created = await prisma.reservation.create({
      data: {
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
        transferId: tr ? tr.id : undefined,
        vehicleTypeId: veh ? veh.id : undefined,
        passengers: {
          create: data.passengers
        }
      }
    });

    console.log(`🚐 Creada reserva de TRASLADO: #${created.id.slice(-6).toUpperCase()} - ${data.customerFirstName} ${data.customerLastName} [${tr?.title || 'Transfer'}] - (${data.status})`);
  }

  console.log("🎉 Se han generado exitosamente las reservas de traslados turísticos.");
}

main()
  .catch(e => {
    console.error("❌ Error en seed-reservas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
