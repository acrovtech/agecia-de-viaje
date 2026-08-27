'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAdminSession } from '@/lib/auth-check';

export async function updateTourMenuGroup(id: string, menuGroup: string | null) {
  await requireAdminSession();
  if (menuGroup === 'none' || menuGroup === '') {
    menuGroup = null;
  }
  
  await prisma.tour.update({
    where: { id },
    data: { menuGroup }
  });

  // Revalidate admin and public routes
  revalidatePath('/megamenus');
  revalidatePath('/'); // Since megamenu affects header everywhere
}
