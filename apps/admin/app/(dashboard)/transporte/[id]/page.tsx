import { prisma, INITIAL_VEHICLES } from '@repo/db';
import { notFound } from 'next/navigation';
import { TransporteForm } from '@/components/forms/transporte-form';

export const dynamic = 'force-dynamic';

export default async function EditTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let transfer = null;
  let vehicles: any[] = [];

  try {
    transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        vehiclePrices: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    vehicles = await prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  } catch (err) {
    console.error('Error loading transfer edit page:', err);
  }

  if (!transfer) {
    notFound();
  }

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
      <TransporteForm vehicles={vehicles} initialData={transfer} />
    </div>
  );
}
