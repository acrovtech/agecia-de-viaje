import { prisma } from '@repo/db';
import { CategoryClientPage } from './client-page';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CategoryClientPage initialCategories={categories} />
    </div>
  );
}
