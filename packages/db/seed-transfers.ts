import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { INITIAL_VEHICLES, INITIAL_TRANSFERS } from './src/transfers-data';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Operación cancelada: No se permite ejecutar seeds de demo en entorno de producción.');
    process.exit(1);
  }

  console.log(`Seeding Vehicles and ${INITIAL_TRANSFERS.length} Core Transfers...`);

  // 1. Seed Vehicles
  const vehicleMap: Record<string, string> = {};
  for (const veh of INITIAL_VEHICLES) {
    const v = await prisma.vehicleType.upsert({
      where: { code: veh.code },
      update: {
        name: veh.name,
        subtitle: veh.subtitle,
        maxPax: veh.maxPax,
        maxLuggage: veh.maxLuggage,
        image: veh.image,
        features: veh.features,
        order: veh.order,
      },
      create: {
        code: veh.code,
        name: veh.name,
        subtitle: veh.subtitle,
        maxPax: veh.maxPax,
        maxLuggage: veh.maxLuggage,
        image: veh.image,
        features: veh.features,
        order: veh.order,
      },
    });
    vehicleMap[veh.code] = v.id;
  }

  // 2. Clean old transfer vehicle prices and transfers that are not in the 10 core routes
  const validSlugs = INITIAL_TRANSFERS.map((t) => t.slug);
  await prisma.transferVehiclePrice.deleteMany({
    where: {
      transfer: {
        slug: { notIn: validSlugs },
      },
    },
  });
  await prisma.transfer.deleteMany({
    where: {
      slug: { notIn: validSlugs },
    },
  });

  // 3. Upsert the 10 core routes
  for (const tr of INITIAL_TRANSFERS) {
    const transfer = await prisma.transfer.upsert({
      where: { slug: tr.slug },
      update: {
        title: tr.title,
        origin: tr.origin,
        destination: tr.destination,
        duration: tr.duration,
        tripType: tr.tripType,
        hasSharedService: tr.hasSharedService,
        sharedPrice: tr.sharedPrice,
        hasPrivateService: tr.hasPrivateService,
        order: tr.order,
        isActive: true,
      },
      create: {
        title: tr.title,
        slug: tr.slug,
        origin: tr.origin,
        destination: tr.destination,
        duration: tr.duration,
        tripType: tr.tripType,
        hasSharedService: tr.hasSharedService,
        sharedPrice: tr.sharedPrice,
        hasPrivateService: tr.hasPrivateService,
        order: tr.order,
        isActive: true,
      },
    });

    // Delete existing prices for this transfer and recreate
    await prisma.transferVehiclePrice.deleteMany({
      where: { transferId: transfer.id },
    });

    for (const [code, price] of Object.entries(tr.vehiclePrices)) {
      const vehicleTypeId = vehicleMap[code];
      if (vehicleTypeId) {
        await prisma.transferVehiclePrice.create({
          data: {
            transfer: { connect: { id: transfer.id } },
            vehicle: { connect: { id: vehicleTypeId } },
            price,
          },
        });
      }
    }
  }

  const finalTransfersCount = await prisma.transfer.count();
  console.log(`✅ Transfers synced successfully! Total in DB: ${finalTransfersCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
