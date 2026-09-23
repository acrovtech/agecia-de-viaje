import { z } from 'zod';
import { catalogDetailSchema } from './catalog-editor';

export const categorySchema = z.object({ id: z.string(), name: z.string(), slug: z.string(), updatedAt: z.string() });
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
