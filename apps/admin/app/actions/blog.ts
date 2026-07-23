'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const BlogSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  bannerImage: z.string().optional().default(''),
  metaTitle: z.string().optional().default(''),
  metaDescription: z.string().optional().default(''),
  keywords: z.string().optional().default('')
});

function extractParagraphs(formData: FormData): { subtitle: string; content: string; image: string; order: number }[] {
  let paragraphs: any[] = [];
  const rawParagraphsJSON = formData.get('paragraphsJSON') as string;

  if (rawParagraphsJSON && rawParagraphsJSON.trim() !== '' && rawParagraphsJSON !== '[]') {
    try {
      paragraphs = JSON.parse(rawParagraphsJSON);
    } catch (e) {
      console.warn("Could not parse paragraphsJSON, falling back to form fields.");
    }
  }

  if (!paragraphs || paragraphs.length === 0) {
    let index = 0;
    while (formData.has(`paragraph_content_${index}`)) {
      const content = (formData.get(`paragraph_content_${index}`) as string) || '';
      if (content.trim() !== '') {
        paragraphs.push({
          subtitle: (formData.get(`paragraph_subtitle_${index}`) as string) || '',
          content,
          image: (formData.get(`paragraph_image_${index}`) as string) || '',
          order: index
        });
      }
      index++;
    }
  }

  return paragraphs.map((p, i) => ({
    subtitle: p.subtitle || '',
    content: p.content || '',
    image: p.image || '',
    order: typeof p.order === 'number' ? p.order : i
  }));
}

export async function createBlog(formData: FormData) {
  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    bannerImage: formData.get('bannerImage') || '',
    metaTitle: formData.get('metaTitle') || '',
    metaDescription: formData.get('metaDescription') || '',
    keywords: formData.get('keywords') || '',
  };

  const parsed = BlogSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error(`Validación fallida: ${parsed.error.issues[0]?.message}`);
  }

  const { title, slug, bannerImage, metaTitle, metaDescription, keywords } = parsed.data;
  const paragraphs = extractParagraphs(formData);

  await prisma.blog.create({
    data: {
      title,
      slug,
      bannerImage,
      metaTitle,
      metaDescription,
      keywords,
      paragraphs: {
        create: paragraphs
      }
    },
  });

  revalidatePath('/blogs');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  redirect('/blogs');
}

export async function updateBlog(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    throw new Error('ID de la publicación no proporcionado.');
  }

  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    bannerImage: formData.get('bannerImage') || '',
    metaTitle: formData.get('metaTitle') || '',
    metaDescription: formData.get('metaDescription') || '',
    keywords: formData.get('keywords') || '',
  };

  const parsed = BlogSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error(`Validación fallida: ${parsed.error.issues[0]?.message}`);
  }

  const { title, slug, bannerImage, metaTitle, metaDescription, keywords } = parsed.data;
  const paragraphs = extractParagraphs(formData);

  await prisma.blog.update({
    where: { id },
    data: {
      title,
      slug,
      bannerImage,
      metaTitle,
      metaDescription,
      keywords,
      paragraphs: {
        deleteMany: {},
        create: paragraphs
      }
    },
  });

  revalidatePath('/blogs');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  redirect('/blogs');
}

export async function deleteBlog(id: string) {
  try {
    await prisma.blog.delete({
      where: { id }
    });
    revalidatePath('/blogs');
    revalidatePath('/blog');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting blog:", error);
    return { success: false, error: "No se pudo eliminar la publicación." };
  }
}
