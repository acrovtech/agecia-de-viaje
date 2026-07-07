'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function updateTourMenuGroup(id: string, menuGroup: string | null) {
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
