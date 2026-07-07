'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;

  if (!name || !slug) {
    throw new Error('Name and slug are required');
  }

  await prisma.category.create({
    data: {
      name,
      slug,
    },
  });

  revalidatePath('/categories');
  redirect('/categories');
}
