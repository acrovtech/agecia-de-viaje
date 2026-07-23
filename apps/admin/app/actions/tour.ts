'use server';

import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTour(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  
  // Text content
  const description = formData.get('description') as string;
  const inclusions = formData.get('inclusions') as string;
  const exclusions = formData.get('exclusions') as string;
  const recommendations = formData.get('recommendations') as string;
  
  // Dynamic Itinerary
  const itineraryCount = parseInt(formData.get('itineraryCount') as string) || 0;
  const itinerary = [];
  for (let i = 0; i < itineraryCount; i++) {
    const title = formData.get(`itinerary_title_${i}`) as string;
    const content = formData.get(`itinerary_content_${i}`) as string;
    if (title || content) {
      itinerary.push({ title, content });
    }
  }

  // Dynamic FAQs
  const faqsCount = parseInt(formData.get('faqsCount') as string) || 0;
  const faqs = [];
  for (let i = 0; i < faqsCount; i++) {
    const question = formData.get(`faq_question_${i}`) as string;
    const answer = formData.get(`faq_answer_${i}`) as string;
    if (question || answer) {
      faqs.push({ question, answer });
    }
  }
  
  // Details
  const duration = formData.get('duration') as string;
  const altitude = formData.get('altitude') as string;
  const groupSizeStr = formData.get('groupSize') as string;
  const groupSize = parseInt(groupSizeStr) || 12; // default to 12 if not provided or invalid
  const difficulty = formData.get('difficulty') as string;
  const mapEmbedUrl = formData.get('mapEmbedUrl') as string;
  
  // Grouping & Featured
  const region = formData.get('region') as string;
  let menuGroup = formData.get('menuGroup') as string;
  if (menuGroup === 'none') menuGroup = '';
  const isFeatured = formData.get('isFeatured') === 'true';
  
  // Categories
  const categoryIds = formData.getAll('categories') as string[];
  
  // Pricing
  const hasSharedService = formData.get('hasSharedService') === 'on';
  const sharedPrice = parseFloat(formData.get('sharedPrice') as string) || null;
  const hasPrivateService = formData.get('hasPrivateService') === 'on';
  
  const privatePricing = [];
  for (let i = 1; i <= groupSize; i++) {
    const price = parseFloat(formData.get(`privatePrice_${i}`) as string);
    if (!isNaN(price)) {
      privatePricing.push({ pax: i, price });
    }
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
  
  const metaTitle = (formData.get('metaTitle') as string) || '';
  const metaDescription = (formData.get('metaDescription') as string) || '';

  const id = formData.get('id') as string;

  if (!title || !slug) {
    throw new Error('Title and slug are required');
  }

  const tourData = {
    title,
    slug,
    description: description || '',
    duration: duration || '',
    altitude: altitude || '',
    groupSize: groupSizeStr || '',
    difficulty: difficulty || 'Fácil',
    mapImage,
    region: region || null,
    menuGroup: menuGroup || null,
    isFeatured,
    hasSharedService,
    sharedPrice,
    hasPrivateService,
    bannerImage,
    cardImage,
    metaTitle,
    metaDescription,
  };

  if (id) {
    // Update existing
    await prisma.tour.update({
      where: { id },
      data: {
        ...tourData,
        itineraries: { deleteMany: {}, create: itinerary.map((item, index) => ({ title: item.title, content: item.content, order: index })) },
        inclusions: { deleteMany: {}, create: inclusions ? inclusions.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) : [] },
        exclusions: { deleteMany: {}, create: exclusions ? exclusions.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) : [] },
        recommendations: { deleteMany: {}, create: recommendations ? recommendations.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) : [] },
        faqs: { deleteMany: {}, create: faqs.map((item, index) => ({ question: item.question, answer: item.answer, order: index })) },
        privatePricing: { deleteMany: {}, create: privatePricing.map(p => ({ pax: p.pax, price: p.price })) },
        images: { deleteMany: {}, create: galleryImages.map((url, order) => ({ url, order })) },
        categories: { set: categoryIds.map(catId => ({ id: catId })) }
      }
    });
  } else {
    // Create new
    await prisma.tour.create({
      data: {
        ...tourData,
        itineraries: itinerary.length > 0 ? { create: itinerary.map((item, index) => ({ title: item.title, content: item.content, order: index })) } : undefined,
        inclusions: inclusions ? { create: inclusions.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) } : undefined,
        exclusions: exclusions ? { create: exclusions.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) } : undefined,
        recommendations: recommendations ? { create: recommendations.split('\n').filter(Boolean).map((item, index) => ({ content: item.trim(), order: index })) } : undefined,
        faqs: faqs.length > 0 ? { create: faqs.map((item, index) => ({ question: item.question, answer: item.answer, order: index })) } : undefined,
        privatePricing: privatePricing.length > 0 ? { create: privatePricing.map(p => ({ pax: p.pax, price: p.price })) } : undefined,
        images: galleryImages.length > 0 ? { create: galleryImages.map((url, order) => ({ url, order })) } : undefined,
        categories: categoryIds.length > 0 ? { connect: categoryIds.map(catId => ({ id: catId })) } : undefined
      },
    });
  }

  revalidatePath('/tours');
  revalidatePath(`/tours/${slug}`);
  redirect('/tours');
}

export async function deleteTour(id: string) {
  try {
    await prisma.tour.delete({
      where: { id }
    });
    revalidatePath('/tours');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting tour:", error);
    return { success: false, error: "No se pudo eliminar el tour." };
  }
}

