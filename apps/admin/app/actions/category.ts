'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminSession, requireMasterRole } from '@/lib/auth-check';

const CategoryInputSchema = z.object({
  name: z.string().min(2, 'El nombre de la categoría es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Slug inválido'),
});

export async function createCategory(name: string, slug: string) {
  await requireAdminSession();
  const parsed = CategoryInputSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de categoría inválidos' };
  }

  try {
    const category = await prisma.category.create({
      data: parsed.data,
    });
    revalidatePath('/categories');
    return { success: true, category };
  } catch (error: any) {
    return { error: handlePrismaError(error) };
  }
}

export async function updateCategory(id: string, name: string, slug: string) {
  await requireAdminSession();
  if (!id) return { error: 'ID de categoría requerido' };

  const parsed = CategoryInputSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos de categoría inválidos' };
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath('/categories');
    return { success: true, category };
  } catch (error: any) {
    return { error: handlePrismaError(error) };
  }
}

export async function deleteCategory(id: string) {
  if (!id) {
    return { error: 'ID de categoría requerido' };
  }

  try {
    await requireMasterRole();
    await prisma.category.delete({
      where: { id },
    });
    revalidatePath('/categories');
    return { success: true };
  } catch (error: any) {
    return { error: handlePrismaError(error) };
  }
}

