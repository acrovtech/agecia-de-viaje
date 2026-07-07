import { prisma } from '@repo/db';
import { TourForm } from '@/components/forms/tour-form';

export const dynamic = 'force-dynamic';

export default async function NewTourPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <TourForm categories={categories} />
    </main>
  );
}
