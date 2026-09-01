'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth-check';

const MegamenuInputSchema = z.object({
  id: z.string().min(1, 'ID de tour requerido'),
  menuGroup: z.string().nullable().optional(),
});

export async function updateTourMenuGroup(id: string, menuGroup: string | null) {
  await requireAdminSession();
  
  const parsed = MegamenuInputSchema.safeParse({
    id,
    menuGroup: menuGroup === 'none' || menuGroup === '' ? null : menuGroup,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Parámetros inválidos' };
  }

  try {
    await prisma.tour.update({
      where: { id: parsed.data.id },
      data: { menuGroup: parsed.data.menuGroup || null }
    });

    // Revalidate admin and public routes
    revalidatePath('/megamenus');
    revalidatePath('/'); // Since megamenu affects header everywhere
    return { success: true };
  } catch (error: any) {
    return { error: handlePrismaError(error) };
  }
}
