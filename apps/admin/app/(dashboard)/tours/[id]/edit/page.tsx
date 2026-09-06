import { prisma } from '@repo/db';
import { TourForm } from '@/components/forms/tour-form';
import { notFound } from 'next/navigation';
import { SetPageTitle } from '@/components/ui/title-context';
import { verifyAdminSession } from '@/lib/auth-check';

export const dynamic = 'force-dynamic';

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifyAdminSession();
  const isGestionUser = session?.email?.trim().toLowerCase() === 'gestion@incabound.com';
  const showCategories = !isGestionUser;

  const tour = await prisma.tour.findUnique({
    where: { id },
    include: {
      categories: true,
      itineraries: { orderBy: { order: 'asc' } },
      inclusions: { orderBy: { order: 'asc' } },
      exclusions: { orderBy: { order: 'asc' } },
      recommendations: { orderBy: { order: 'asc' } },
      faqs: { orderBy: { order: 'asc' } },
      privatePricing: { orderBy: { pax: 'asc' } },
      images: { orderBy: { order: 'asc' } }
    }
  });

  if (!tour) {
    return notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <SetPageTitle title={`Editar Tour > ${tour.title}`} />
      <TourForm categories={categories} initialData={tour} showCategories={showCategories} />
    </main>
  );
}
