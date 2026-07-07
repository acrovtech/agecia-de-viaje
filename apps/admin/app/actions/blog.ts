'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBlog(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const bannerImage = formData.get('bannerImage') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;
  
  const paragraphsCount = parseInt(formData.get('paragraphsCount') as string) || 0;

  if (!title || !slug || !bannerImage) {
    throw new Error('Title, slug and bannerImage are required');
  }

  // Preparar párrafos
  const paragraphs = [];
  for (let i = 0; i < paragraphsCount; i++) {
    const content = formData.get(`paragraph_content_${i}`) as string;
    const image = formData.get(`paragraph_image_${i}`) as string;
    
    if (content) {
      paragraphs.push({
        order: i,
        content,
        image: image || null
      });
    }
  }

  await prisma.blog.create({
    data: {
      title,
      slug,
      bannerImage,
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      paragraphs: {
        create: paragraphs
      }
    },
  });

  revalidatePath('/blogs');
  redirect('/blogs');
}
