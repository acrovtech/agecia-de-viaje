import { prisma } from '@repo/db';
import { TransporteClient } from './transporte-client';

export const dynamic = 'force-dynamic';

export default async function TransporteListPage() {
  let transfers: any[] = [];
  try {
    transfers = await prisma.transfer.findMany({
      orderBy: { order: 'asc' },
      include: {
        vehiclePrices: {
          include: {
            vehicle: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
  }

  return <TransporteClient initialTransfers={transfers} />;
}
