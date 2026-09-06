import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import { CategoryClientPage } from './client-page';
import { verifyAdminSession } from '@/lib/auth-check';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const session = await verifyAdminSession();
  if (session?.email?.trim().toLowerCase() === 'gestion@incabound.com') {
    redirect('/');
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CategoryClientPage initialCategories={categories} />
    </div>
  );
}
