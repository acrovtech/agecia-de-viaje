'use server';

import { prisma, handlePrismaError } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireMasterRole, requireContentOrMaster } from '@/lib/auth-check';

const TourInputSchema = z.object({
  title: z.string().min(2, 'El título del tour es obligatorio (mínimo 2 caracteres)'),
  slug: z.string().min(2, 'El slug es obligatorio').regex(/^[a-z0-9-]+$/, 'El slug solo debe contener letras minúsculas, números y guiones'),
  description: z.string().default(''),
  duration: z.string().default(''),
  altitude: z.string().default(''),
  groupSize: z.string().default('12'),
  difficulty: z.string().default('Fácil'),
});

export async function createTour(formData: FormData) {
  const session = await requireContentOrMaster();
  const id = (formData.get('id') as string)?.trim() || undefined;
  const rawTitle = (formData.get('title') as string)?.trim() || '';
  const rawSlug = (formData.get('slug') as string)?.trim()?.toLowerCase() || '';

  const validatedFields = TourInputSchema.safeParse({
    title: rawTitle,
    slug: rawSlug,
    description: (formData.get('description') as string) || '',
    duration: (formData.get('duration') as string) || '',
    altitude: (formData.get('altitude') as string) || '',
    groupSize: (formData.get('groupSize') as string) || '12',
    difficulty: (formData.get('difficulty') as string) || 'Fácil',
  });

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0]?.message || 'Datos de tour inválidos';
    throw new Error(errorMsg);
  }

  const { title, slug } = validatedFields.data;

  // Text content
  const description = formData.get('description') as string || '';
  const inclusions = formData.get('inclusions') as string || '';
  const exclusions = formData.get('exclusions') as string || '';
  const recommendations = formData.get('recommendations') as string || '';
  
  // Dynamic Itinerary
  const itinerary: { title: string; content: string; order: number }[] = [];
  const itineraryCount = parseInt(formData.get('itineraryCount') as string) || 50;
  for (let i = 0; i < itineraryCount; i++) {
    const dayTitle = (formData.get(`itinerary_title_${i}`) as string)?.trim();
    const dayContent = (formData.get(`itinerary_content_${i}`) as string)?.trim();
    if (dayTitle || dayContent) {
      itinerary.push({ 
        title: dayTitle || `Día ${i + 1}`, 
        content: dayContent || '',
        order: i 
      });
    }
  }

  // Dynamic FAQs
  const faqs: { question: string; answer: string; order: number }[] = [];
  const faqsCount = parseInt(formData.get('faqsCount') as string) || 50;
  for (let i = 0; i < faqsCount; i++) {
    const question = (formData.get(`faq_question_${i}`) as string)?.trim();
    const answer = (formData.get(`faq_answer_${i}`) as string)?.trim();
    if (question || answer) {
      faqs.push({ 
        question: question || `Pregunta ${i + 1}`, 
        answer: answer || '',
        order: i 
      });
    }
  }
  
  // Details
  const duration = (formData.get('duration') as string)?.trim() || '';
  const altitude = (formData.get('altitude') as string)?.trim() || '';
  const groupSizeStr = (formData.get('groupSize') as string)?.trim() || '12';
  const difficulty = (formData.get('difficulty') as string)?.trim() || 'Fácil';
  const mapEmbedUrl = (formData.get('mapEmbedUrl') as string)?.trim() || '';
  
  // Grouping & Featured
  const region = (formData.get('region') as string)?.trim() || null;
  let menuGroup = (formData.get('menuGroup') as string)?.trim() || null;
  if (menuGroup === 'none') menuGroup = null;
  const isFeatured = formData.get('isFeatured') === 'true';
  
  // Categories
  const categoryIds = (formData.getAll('categories') as string[]).filter(Boolean);
  
  // Pricing
  const hasSharedService = formData.get('hasSharedService') === 'on' || formData.get('hasSharedService') === 'true';
  const sharedPriceRaw = formData.get('sharedPrice') as string;
  const sharedPrice = sharedPriceRaw ? parseFloat(sharedPriceRaw) : null;
  const hasPrivateService = formData.get('hasPrivateService') === 'on' || formData.get('hasPrivateService') === 'true';
  
  const privatePricing: { pax: number; price: number }[] = [];
  if (hasPrivateService) {
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('privatePrice_')) {
        const pax = parseInt(key.replace('privatePrice_', ''), 10);
        const price = parseFloat(val as string);
        if (!isNaN(pax) && !isNaN(price) && price >= 0) {
          privatePricing.push({ pax, price });
        }
      }
    }
    privatePricing.sort((a, b) => a.pax - b.pax);
  }

  // Helper to strictly extract string values for media fields
  const parseStringValue = (fieldName: string, fallback: string = ''): string => {
    const urlInput = formData.get(`${fieldName}_url`);
    if (typeof urlInput === 'string' && urlInput.trim()) {
      return urlInput.trim();
    }
    const val = formData.get(fieldName);
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
    return fallback;
  };

  // Media & SEO
  const bannerImage = parseStringValue('bannerImage', '');
  const cardImage = parseStringValue('cardImage', '');
  const mapImage = parseStringValue('mapImage', '');
  const galleryImage1 = parseStringValue('galleryImage_1', '');
  const galleryImage2 = parseStringValue('galleryImage_2', '');
  const galleryImage3 = parseStringValue('galleryImage_3', '');
  const galleryImage4 = parseStringValue('galleryImage_4', '');
  const galleryImages = [galleryImage1, galleryImage2, galleryImage3, galleryImage4].filter(Boolean);
  
  const metaTitle = (formData.get('metaTitle') as string)?.trim() || '';
  const metaDescription = (formData.get('metaDescription') as string)?.trim() || '';

  const tourData = {
    title,
    slug,
    description,
    duration,
    altitude,
    groupSize: groupSizeStr,
    difficulty,
    mapImage,
    region,
    menuGroup,
    isFeatured,
    hasSharedService,
    sharedPrice,
    hasPrivateService,
    bannerImage,
    cardImage,
    metaTitle,
    metaDescription,
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        // Update existing Tour con transacción atómica
        await tx.tour.update({
          where: { id },
          data: {
            ...tourData,
            itineraries: { 
              deleteMany: {}, 
              create: itinerary.map((item, index) => ({ title: item.title, content: item.content, order: index })) 
            },
            inclusions: { 
              deleteMany: {}, 
              create: inclusions ? inclusions.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) : [] 
            },
            exclusions: { 
              deleteMany: {}, 
              create: exclusions ? exclusions.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) : [] 
            },
            recommendations: { 
              deleteMany: {}, 
              create: recommendations ? recommendations.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) : [] 
            },
            faqs: { 
              deleteMany: {}, 
              create: faqs.map((item, index) => ({ question: item.question, answer: item.answer, order: index })) 
            },
            privatePricing: { 
              deleteMany: {}, 
              create: privatePricing.map(p => ({ pax: p.pax, price: p.price })) 
            },
            images: { 
              deleteMany: {}, 
              create: galleryImages.map((url, order) => ({ url, order })) 
            },
            categories: { 
              set: categoryIds.map(catId => ({ id: catId })) 
            }
          }
        });
      } else {
        // Create new Tour con transacción atómica
        await tx.tour.create({
          data: {
            ...tourData,
            ...(session.agencyId ? { agencyId: session.agencyId } : {}),
            itineraries: itinerary.length > 0 ? { 
              create: itinerary.map((item, index) => ({ title: item.title, content: item.content, order: index })) 
            } : undefined,
            inclusions: inclusions ? { 
              create: inclusions.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) 
            } : undefined,
            exclusions: exclusions ? { 
              create: exclusions.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) 
            } : undefined,
            recommendations: recommendations ? { 
              create: recommendations.split('\n').map(s => s.trim()).filter(Boolean).map((content, index) => ({ content, order: index })) 
            } : undefined,
            faqs: faqs.length > 0 ? { 
              create: faqs.map((item, index) => ({ question: item.question, answer: item.answer, order: index })) 
            } : undefined,
            privatePricing: privatePricing.length > 0 ? { 
              create: privatePricing.map(p => ({ pax: p.pax, price: p.price })) 
            } : undefined,
            images: galleryImages.length > 0 ? { 
              create: galleryImages.map((url, order) => ({ url, order })) 
            } : undefined,
            categories: categoryIds.length > 0 ? { 
              connect: categoryIds.map(catId => ({ id: catId })) 
            } : undefined
          },
        });
      }
    });
  } catch (error: any) {
    console.error("Error guardando el tour:", error);
    throw new Error(handlePrismaError(error));
  }

  revalidatePath('/tours');
  revalidatePath('/(dashboard)/tours', 'page');
  revalidatePath(`/tours/${slug}`);
  revalidatePath(`/(dashboard)/tours/[id]/edit`, 'page');
  if (id) {
    revalidatePath(`/tours/${id}/edit`);
    revalidatePath(`/(dashboard)/tours/${id}/edit`);
  }
  redirect('/tours');
}

export async function deleteTour(id: string) {
  try {
    await requireMasterRole();
    await prisma.$transaction(async (tx) => {
      await tx.tour.delete({
        where: { id }
      });
    });
    revalidatePath('/tours');
    revalidatePath('/(dashboard)/tours', 'page');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting tour:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function setToursFeaturedStatus(tourIds: string[], isFeatured: boolean) {
  try {
    await requireContentOrMaster();
    if (!tourIds.length) return { success: true };

    if (isFeatured) {
      // Contar cuántos tours destacados hay actualmente excluyendo los seleccionados
      const currentOtherFeatured = await prisma.tour.count({
        where: {
          isFeatured: true,
          id: { notIn: tourIds },
        },
      });

      if (currentOtherFeatured + tourIds.length > 6) {
        return {
          success: false,
          error: `No puedes superar el límite de 6 tours recomendados. Actualmente hay ${currentOtherFeatured} tours en el Home y seleccionaste ${tourIds.length}.`,
        };
      }
    }

    await prisma.tour.updateMany({
      where: { id: { in: tourIds } },
      data: { isFeatured },
    });

    revalidatePath('/tours');
    revalidatePath('/(dashboard)/tours', 'page');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating featured status:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

export async function toggleTourFeaturedStatus(id: string) {
  try {
    await requireContentOrMaster();
    const tour = await prisma.tour.findUnique({
      where: { id },
      select: { id: true, isFeatured: true, title: true },
    });

    if (!tour) {
      return { success: false, error: 'Tour no encontrado.' };
    }

    const nextStatus = !tour.isFeatured;

    if (nextStatus) {
      const currentCount = await prisma.tour.count({
        where: { isFeatured: true },
      });

      if (currentCount >= 6) {
        return {
          success: false,
          error: 'Ya tienes 6 tours recomendados en el Home (límite máximo). Desmarca uno para agregar este.',
        };
      }
    }

    await prisma.tour.update({
      where: { id },
      data: { isFeatured: nextStatus },
    });

    revalidatePath('/tours');
    revalidatePath('/(dashboard)/tours', 'page');
    revalidatePath('/');
    return { success: true, isFeatured: nextStatus };
  } catch (error: any) {
    console.error("Error toggling featured status:", error);
    return { success: false, error: handlePrismaError(error) };
  }
}

