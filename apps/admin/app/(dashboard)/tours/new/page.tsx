import { prisma } from '@repo/db';
import { TourForm } from '@/components/forms/tour-form';
import { verifyAdminSession } from '@/lib/auth-check';

export const dynamic = 'force-dynamic';

export default async function NewTourPage() {
  const session = await verifyAdminSession();
  const isGestionUser = session?.email?.trim().toLowerCase() === 'gestion@incabound.com';
  const showCategories = !isGestionUser;

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <TourForm categories={categories} showCategories={showCategories} />
    </main>
  );
}
