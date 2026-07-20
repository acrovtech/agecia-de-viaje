'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const BlogParagraphSchema = z.object({
  subtitle: z.string().nullable().optional(),
  content: z.string().min(1, 'El contenido es requerido'),
  image: z.string().nullable().optional(),
  order: z.number().int().nonnegative()
});

const BlogSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug es requerido'),
  bannerImage: z.string().url('Debe ser una URL válida'),
  metaTitle: z.string().optional().default(''),
  metaDescription: z.string().optional().default(''),
  keywords: z.string().optional().default(''),
  paragraphsJSON: z.string().min(1, 'Los párrafos son requeridos')
});

export async function createBlog(formData: FormData) {
  // 1. Validar los datos principales del formulario
  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    bannerImage: formData.get('bannerImage'),
    metaTitle: formData.get('metaTitle') || '',
    metaDescription: formData.get('metaDescription') || '',
    keywords: formData.get('keywords') || '',
    paragraphsJSON: formData.get('paragraphsJSON'),
  };

  const parsed = BlogSchema.safeParse(rawData);

  if (!parsed.success) {
    // Para simplificar, devolvemos el primer error, pero en una app real 
    // podrías devolver todo el objeto de errores o usar next-safe-action
    throw new Error(`Validación fallida: ${parsed.error.issues[0]?.message}`);
  }

  const { title, slug, bannerImage, metaTitle, metaDescription, keywords, paragraphsJSON } = parsed.data;

  // 2. Validar los párrafos desde el JSON
  let paragraphs = [];
  try {
    const rawParagraphs = JSON.parse(paragraphsJSON);
    paragraphs = z.array(BlogParagraphSchema).parse(rawParagraphs);
  } catch (error) {
    throw new Error('Error al parsear o validar los párrafos del blog.');
  }

  // 3. Crear el registro en la base de datos de manera segura
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
  redirect('/blogs');
}
