import { prisma } from '@repo/db';
import { TourForm } from '@/components/forms/tour-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditTourPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const tour = await prisma.tour.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          category: true
        }
      },
      itineraries: { orderBy: { order: 'asc' } },
      inclusions: { orderBy: { order: 'asc' } },
      exclusions: { orderBy: { order: 'asc' } },
      recommendations: { orderBy: { order: 'asc' } },
      faqs: { orderBy: { order: 'asc' } }
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Tour</h1>
          <p className="text-sm text-slate-500 mt-1">Estás editando: {tour.title}</p>
        </div>
      </div>
      <TourForm categories={categories} initialData={tour} />
    </main>
  );
}
