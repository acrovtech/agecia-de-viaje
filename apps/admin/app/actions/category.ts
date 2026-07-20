'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function createCategory(name: string, slug: string) {
  if (!name || !slug) {
    return { error: 'Name and slug are required' };
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug },
    });
    revalidatePath('/categories');
    return { success: true, category };
  } catch (error) {
    return { error: 'Failed to create category or slug already exists' };
  }
}

export async function updateCategory(id: string, name: string, slug: string) {
  if (!id || !name || !slug) {
    return { error: 'All fields are required' };
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });
    revalidatePath('/categories');
    return { success: true, category };
  } catch (error) {
    return { error: 'Failed to update category' };
  }
}

export async function deleteCategory(id: string) {
  if (!id) {
    return { error: 'ID is required' };
  }

  try {
    await prisma.category.delete({
      where: { id },
    });
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete category' };
  }
}
