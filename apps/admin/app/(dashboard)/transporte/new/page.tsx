import { prisma, INITIAL_VEHICLES } from '@repo/db';
import { TransporteForm } from '@/components/forms/transporte-form';

export const dynamic = 'force-dynamic';

export default async function NewTransferPage() {
  let vehicles: any[] = [];
  try {
    vehicles = await prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
  }

  // If vehicles table in DB is empty, use default INITIAL_VEHICLES formatted
  if (!vehicles || vehicles.length === 0) {
    vehicles = INITIAL_VEHICLES.map((v: any, i: number) => ({
      id: v.code,
      code: v.code,
      name: v.name,
      subtitle: v.subtitle,
      maxPax: v.maxPax,
      maxLuggage: v.maxLuggage,
      image: v.image,
      features: v.features,
      order: v.order,
    }));
  }

  return (
    <div className="space-y-6">
      <TransporteForm vehicles={vehicles} />
    </div>
  );
}
