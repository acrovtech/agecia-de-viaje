import { z } from 'zod';

export type CatalogKind = 'tours' | 'transfers';
export const catalogDetailSchema = z.object({
  id: z.string(), title: z.string(), slug: z.string(), description: z.string().nullable(), duration: z.string(),
  bannerImage: z.string().nullable(), cardImage: z.string().optional(), region: z.string().nullable().optional(),
  origin: z.string().optional(), destination: z.string().optional(), tripType: z.string().optional(),
  isActive: z.boolean().optional(), hasSharedService: z.boolean(), sharedPrice: z.number().nullable(),
  hasPrivateService: z.boolean(), updatedAt: z.string().datetime(),
  isPublished: z.boolean().default(false),
});
export type CatalogDetail = z.infer<typeof catalogDetailSchema>;
export function canEditCatalog(role: string, kind: CatalogKind) {
  return ['OWNER', 'ADMIN', kind === 'tours' ? 'EDITOR' : 'OPERATOR'].includes(role);
}
