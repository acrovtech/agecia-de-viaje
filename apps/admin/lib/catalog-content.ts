import { z } from 'zod';
import { catalogDetailSchema } from './catalog-editor';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable().optional(),
  parent: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
  }).nullable().optional(),
  updatedAt: z.string(),
});
export const vehicleSchema = z.object({ id: z.string(), code: z.string(), name: z.string(), subtitle: z.string().nullable(), maxPax: z.number(), maxLuggage: z.number(), image: z.string(), features: z.array(z.string()), isActive: z.boolean(), updatedAt: z.string() });
export const tourContentSchema = catalogDetailSchema.extend({
  categories: z.array(categorySchema),
  images: z.array(z.object({ url: z.string(), alt: z.string().nullable() })),
  itineraries: z.array(z.object({ title: z.string(), content: z.string() })),
  inclusions: z.array(z.object({ content: z.string() })), exclusions: z.array(z.object({ content: z.string() })), recommendations: z.array(z.object({ content: z.string() })),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })), privatePricing: z.array(z.object({ pax: z.number(), price: z.number() })),
});
export const transferContentSchema = catalogDetailSchema.extend({ vehiclePrices: z.array(z.object({ vehicleId: z.string(), price: z.number(), vehicle: vehicleSchema })) });
export type TourContent = z.infer<typeof tourContentSchema>;
export type TransferContent = z.infer<typeof transferContentSchema>;
export type CategoryResource = z.infer<typeof categorySchema>;
export type VehicleResource = z.infer<typeof vehicleSchema>;

export const tourTranslationItemSchema = z.object({
  id: z.string().optional(),
  locale: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  itinerary: z.array(z.object({ title: z.string(), content: z.string(), order: z.number().optional() })).nullable().optional(),
  inclusions: z.array(z.object({ content: z.string(), order: z.number().optional() })).nullable().optional(),
  exclusions: z.array(z.object({ content: z.string(), order: z.number().optional() })).nullable().optional(),
  recommendations: z.array(z.object({ content: z.string(), order: z.number().optional() })).nullable().optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string(), order: z.number().optional() })).nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  focusKeyphrase: z.string().nullable().optional(),
  reviewStatus: z.string().optional(),
  generatedByAi: z.boolean().optional(),
  sourceRevision: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  isStale: z.boolean().optional(),
});

export const tourTranslationsResponseSchema = z.object({
  defaultLocale: z.string(),
  enabledLocales: z.array(z.string()),
  currentSourceRevision: z.string(),
  translations: z.array(tourTranslationItemSchema),
});

export const tourTranslationSchema = z.object({
  expectedUpdatedAt: z.string().nullable().optional(),
  expectedSourceRevision: z.string().trim().min(1, 'La revisión del contenido base es obligatoria'),
  title: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones').min(1).max(100),
  description: z.string().optional(),
  itinerary: z.array(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    order: z.number().int().optional(),
  })).optional(),
  inclusions: z.array(z.object({
    content: z.string().min(1),
    order: z.number().int().optional(),
  })).optional(),
  exclusions: z.array(z.object({
    content: z.string().min(1),
    order: z.number().int().optional(),
  })).optional(),
  recommendations: z.array(z.object({
    content: z.string().min(1),
    order: z.number().int().optional(),
  })).optional(),
  faqs: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    order: z.number().int().optional(),
  })).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  focusKeyphrase: z.string().max(100).optional(),
});

export type TourTranslationInput = z.infer<typeof tourTranslationSchema>;
export type TourTranslationItem = z.infer<typeof tourTranslationItemSchema>;
export type TourTranslationsResponse = z.infer<typeof tourTranslationsResponseSchema>;
