import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db/prisma';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import { image, money, text, parse, conflict, tourSelect, transferSelect } from './catalog-write.service.js';
import { computeSourceRevision } from './source-revision.js';

const version = { expectedUpdatedAt: z.string().datetime() };
const id = z.string().min(1).max(128);
const content = z.string().trim().min(1).max(5000);
const simpleItems = z.array(z.object({ content }).strict()).max(50);
const tourContent = z.object({
  ...version, hasPrivateService: z.boolean(),
  images: z.array(z.object({ url: image, alt: z.string().trim().max(200).nullable() }).strict()).max(50),
  itineraries: z.array(z.object({ title: text, content }).strict()).max(50),
  categoryIds: z.array(id).max(50).refine((ids) => new Set(ids).size === ids.length),
  privatePricing: z.array(z.object({ pax: z.number().int().min(1).max(100), price: money }).strict()).max(100).refine((rows) => new Set(rows.map((row) => row.pax)).size === rows.length),
  inclusions: simpleItems, exclusions: simpleItems, recommendations: simpleItems,
  faqs: z.array(z.object({ question: text, answer: content }).strict()).max(50),
}).strict();
const transferContent = z.object({
  ...version, hasPrivateService: z.boolean(),
  vehiclePrices: z.array(z.object({ vehicleId: id, price: money }).strict()).max(100).refine((rows) => new Set(rows.map((row) => row.vehicleId)).size === rows.length),
}).strict();
const category = z.object({
  name: text,
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentId: id.nullable().optional(),
}).strict();
const vehicle = z.object({
  code: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: text,
  subtitle: z.string().trim().max(200).nullable(), maxPax: z.number().int().min(1).max(100),
  maxLuggage: z.number().int().min(0).max(200), image,
  features: z.array(text).max(30), isActive: z.boolean(),
}).strict();
const translationItineraryItem = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(10000),
  order: z.number().int().min(0).max(100).optional(),
}).strict();

const translationBulletItem = z.object({
  content: z.string().trim().min(1).max(500),
  order: z.number().int().min(0).max(100).optional(),
}).strict();

const translationFaqItem = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
  order: z.number().int().min(0).max(100).optional(),
}).strict();

const tourTranslationSchema = z.object({
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
  expectedSourceRevision: z.string().trim().min(1, 'La revisión del contenido base es obligatoria'),
  title: text,
  slug: z.string().trim().min(1, 'El slug es obligatorio').max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe contener solo letras minúsculas, números y guiones'),
  description: z.string().nullable().optional(),
  itinerary: z.array(translationItineraryItem).max(30).nullable().optional(),
  inclusions: z.array(translationBulletItem).max(50).nullable().optional(),
  exclusions: z.array(translationBulletItem).max(50).nullable().optional(),
  recommendations: z.array(translationBulletItem).max(50).nullable().optional(),
  faqs: z.array(translationFaqItem).max(50).nullable().optional(),
  metaTitle: z.string().trim().max(100).nullable().optional(),
  metaDescription: z.string().trim().max(300).nullable().optional(),
  focusKeyphrase: z.string().trim().max(100).nullable().optional(),
}).strict();
const categorySelect = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  parent: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  updatedAt: true,
} satisfies Prisma.CategorySelect;
const vehicleSelect = { id: true, code: true, name: true, subtitle: true, maxPax: true, maxLuggage: true, image: true, features: true, isActive: true, updatedAt: true } satisfies Prisma.VehicleTypeSelect;
const nextVersion = (value: string) => new Date(Math.max(Date.now(), Date.parse(value) + 1));

@Injectable()
export class CatalogContentService {
  constructor(private readonly prisma: PrismaService) {}

  private async transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try { return await this.prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) { return conflict(error); }
  }

  private audit(tx: Prisma.TransactionClient, who: ApiIdentity, entity: string, entityId: string, action: string) {
    return tx.adminAuditLog.create({ data: { userId: who.userId, entity, entityId, action,
      details: { agencyId: who.agencyId, actorId: who.userId, membershipId: who.membershipId, role: who.role },
    } });
  }

  async tour(agencyId: string, id: string) {
    const row = await this.prisma.tour.findFirst({ where: { id, agencyId }, select: {
      ...tourSelect, categories: { where: { agencyId }, select: categorySelect },
      images: { orderBy: { order: 'asc' } }, itineraries: { orderBy: { order: 'asc' } },
      inclusions: { orderBy: { order: 'asc' } }, exclusions: { orderBy: { order: 'asc' } },
      recommendations: { orderBy: { order: 'asc' } }, faqs: { orderBy: { order: 'asc' } }, privatePricing: { orderBy: { pax: 'asc' } },
    } });
    if (!row) throw new NotFoundException();
    return row;
  }
  async transfer(agencyId: string, id: string) {
    const row = await this.prisma.transfer.findFirst({ where: { id, agencyId }, select: {
      ...transferSelect, vehiclePrices: { where: { vehicle: { agencyId } }, select: { vehicleId: true, price: true, vehicle: { select: vehicleSelect } } },
    } });
    if (!row) throw new NotFoundException();
    return row;
  }

  async saveTour(who: ApiIdentity, id: string, body: unknown) {
    const data = parse(tourContent, body);
    if (data.hasPrivateService && !data.privatePricing.length) throw new BadRequestException();
    await this.transaction(async (tx) => {
      if (!await tx.tour.findFirst({ where: { id, agencyId: who.agencyId }, select: { id: true } })) throw new NotFoundException();
      if (await tx.category.count({ where: { id: { in: data.categoryIds }, agencyId: who.agencyId } }) !== data.categoryIds.length) throw new BadRequestException();
      const changed = await tx.tour.updateMany({ where: { id, agencyId: who.agencyId, updatedAt: new Date(data.expectedUpdatedAt) }, data: {
        hasPrivateService: data.hasPrivateService, isPublished: false, updatedAt: nextVersion(data.expectedUpdatedAt),
      } });
      if (changed.count !== 1) throw new ConflictException();
      const ordered = <T>(rows: T[]) => rows.map((row, order) => ({ ...row, order }));
      await tx.tour.update({ where: { id, agencyId: who.agencyId }, data: {
        updatedAt: nextVersion(data.expectedUpdatedAt),
        categories: { set: data.categoryIds.map((id) => ({ id })) },
        images: { deleteMany: {}, create: ordered(data.images) },
        itineraries: { deleteMany: {}, create: ordered(data.itineraries) },
        inclusions: { deleteMany: {}, create: ordered(data.inclusions) },
        exclusions: { deleteMany: {}, create: ordered(data.exclusions) },
        recommendations: { deleteMany: {}, create: ordered(data.recommendations) },
        faqs: { deleteMany: {}, create: ordered(data.faqs) },
        privatePricing: { deleteMany: {}, create: data.privatePricing },
      } });
      await this.audit(tx, who, 'Tour', id, 'SAAS_CONTENT_SAVE');
    });
    return this.tour(who.agencyId, id);
  }

  async saveTransfer(who: ApiIdentity, id: string, body: unknown) {
    const data = parse(transferContent, body);
    if (data.hasPrivateService && !data.vehiclePrices.length) throw new BadRequestException();
    await this.transaction(async (tx) => {
      if (!await tx.transfer.findFirst({ where: { id, agencyId: who.agencyId }, select: { id: true } })) throw new NotFoundException();
      if (await tx.vehicleType.count({ where: { id: { in: data.vehiclePrices.map((row) => row.vehicleId) }, agencyId: who.agencyId, isActive: true } }) !== data.vehiclePrices.length) throw new BadRequestException();
      const changed = await tx.transfer.updateMany({ where: { id, agencyId: who.agencyId, updatedAt: new Date(data.expectedUpdatedAt) }, data: {
        hasPrivateService: data.hasPrivateService, isPublished: false, updatedAt: nextVersion(data.expectedUpdatedAt),
      } });
      if (changed.count !== 1) throw new ConflictException();
      await tx.transfer.update({ where: { id, agencyId: who.agencyId }, data: { updatedAt: nextVersion(data.expectedUpdatedAt), vehiclePrices: { deleteMany: {}, create: data.vehiclePrices } } });
      await this.audit(tx, who, 'Transfer', id, 'SAAS_CONTENT_SAVE');
    });
    return this.transfer(who.agencyId, id);
  }

  async publish(who: ApiIdentity, kind: 'tours' | 'transfers', id: string, body: unknown) {
    const data = parse(z.object({ ...version, isPublished: z.boolean() }).strict(), body);
    await this.transaction(async (tx) => {
      if (kind === 'tours') {
        const row = await tx.tour.findFirst({ where: { id, agencyId: who.agencyId }, include: { privatePricing: true, categories: true } });
        if (!row) throw new NotFoundException();
        if (data.isPublished && (
          !row.title?.trim() ||
          !row.description?.trim() ||
          !row.duration?.trim() ||
          !row.bannerImage || !image.safeParse(row.bannerImage).success ||
          !row.cardImage || !image.safeParse(row.cardImage).success ||
          (!row.hasSharedService && !row.hasPrivateService) ||
          (row.hasSharedService && (!row.sharedPrice || !money.safeParse(row.sharedPrice).success)) ||
          (row.hasPrivateService && (!row.privatePricing.length || row.privatePricing.some((p) => !money.safeParse(p.price).success || p.pax < 1))) ||
          row.categories.some((c) => c.agencyId !== who.agencyId)
        )) {
          throw new BadRequestException('El tour no cumple con los requisitos mínimos para ser publicado');
        }
        const changed = await tx.tour.updateMany({ where: { id, agencyId: who.agencyId, updatedAt: new Date(data.expectedUpdatedAt) }, data: { isPublished: data.isPublished, updatedAt: nextVersion(data.expectedUpdatedAt) } });
        if (changed.count !== 1) throw new ConflictException();
      } else {
        const row = await tx.transfer.findFirst({ where: { id, agencyId: who.agencyId }, include: { vehiclePrices: { include: { vehicle: true } } } });
        if (!row) throw new NotFoundException();
        if (data.isPublished && (!row.isActive || !row.title.trim() || !row.origin.trim() || !row.destination.trim() ||
          (!row.hasSharedService && !row.hasPrivateService) || (row.hasSharedService && !money.safeParse(row.sharedPrice).success) ||
          (row.hasPrivateService && (!row.vehiclePrices.length || row.vehiclePrices.some((p) => p.vehicle.agencyId !== who.agencyId || !p.vehicle.isActive || !money.safeParse(p.price).success))))) throw new BadRequestException();
        const changed = await tx.transfer.updateMany({ where: { id, agencyId: who.agencyId, updatedAt: new Date(data.expectedUpdatedAt) }, data: { isPublished: data.isPublished, updatedAt: nextVersion(data.expectedUpdatedAt) } });
        if (changed.count !== 1) throw new ConflictException();
      }
      await this.audit(tx, who, kind === 'tours' ? 'Tour' : 'Transfer', id, data.isPublished ? 'SAAS_PUBLISH' : 'SAAS_UNPUBLISH');
    });
    return kind === 'tours' ? this.tour(who.agencyId, id) : this.transfer(who.agencyId, id);
  }

  async resources(agencyId: string, kind: 'categories' | 'vehicles', query: unknown) {
    const { after } = parse(z.object({ after: id.optional() }).strict(), query);
    const where = { agencyId, ...(after ? { id: { gt: after } } : {}) };
    const rows = kind === 'categories'
      ? await this.prisma.category.findMany({ where, select: categorySelect, orderBy: { id: 'asc' }, take: 101 })
      : await this.prisma.vehicleType.findMany({ where, select: vehicleSelect, orderBy: { id: 'asc' }, take: 101 });
    return { data: rows.slice(0, 100), nextCursor: rows.length > 100 ? rows[99]!.id : null };
  }

  async saveCategory(who: ApiIdentity, resourceId: string | undefined, body: unknown) {
    const data = resourceId ? parse(category.extend(version), body) : parse(category, body);
    try { return await this.transaction(async (tx) => {
      if (data.parentId) {
        if (resourceId && data.parentId === resourceId) {
          throw new BadRequestException('A category cannot be its own parent');
        }
        const parent = await tx.category.findFirst({
          where: { id: data.parentId, agencyId: who.agencyId },
        });
        if (!parent) {
          throw new BadRequestException('Parent category must exist in the same agency');
        }
      }
      const values = { name: data.name, slug: data.slug, parentId: data.parentId ?? null };
      let row;
      if (resourceId) {
        const expected = (data as z.infer<typeof category> & { expectedUpdatedAt: string }).expectedUpdatedAt;
        if (!await tx.category.findFirst({ where: { id: resourceId, agencyId: who.agencyId } })) throw new NotFoundException();
        if ((await tx.category.updateMany({ where: { id: resourceId, agencyId: who.agencyId, updatedAt: new Date(expected) }, data: { ...values, updatedAt: nextVersion(expected) } })).count !== 1) throw new ConflictException();
        const affected = await tx.tour.findMany({ where: { agencyId: who.agencyId, categories: { some: { id: resourceId } } }, select: { id: true, updatedAt: true } });
        for (const item of affected) await tx.tour.update({ where: { id: item.id, agencyId: who.agencyId }, data: { isPublished: false, updatedAt: nextVersion(item.updatedAt.toISOString()) } });
        row = await tx.category.findUniqueOrThrow({ where: { id: resourceId }, select: categorySelect });
      } else row = await tx.category.create({ data: { ...values, agencyId: who.agencyId }, select: categorySelect });
      await this.audit(tx, who, 'Category', row.id, resourceId ? 'SAAS_RESOURCE_UPDATE' : 'SAAS_RESOURCE_CREATE');
      return row;
    }); } catch (error) { conflict(error); }
  }

  async saveVehicle(who: ApiIdentity, resourceId: string | undefined, body: unknown) {
    const data = resourceId ? parse(vehicle.extend(version), body) : parse(vehicle, body);
    const { code, name, subtitle, maxPax, maxLuggage, image, features, isActive } = data;
    const values = { code, name, subtitle, maxPax, maxLuggage, image, features, isActive };
    try { return await this.transaction(async (tx) => {
      let row;
      if (resourceId) {
        const expected = (data as z.infer<typeof vehicle> & { expectedUpdatedAt: string }).expectedUpdatedAt;
        if (!await tx.vehicleType.findFirst({ where: { id: resourceId, agencyId: who.agencyId } })) throw new NotFoundException();
        if ((await tx.vehicleType.updateMany({ where: { id: resourceId, agencyId: who.agencyId, updatedAt: new Date(expected) }, data: { ...values, updatedAt: nextVersion(expected) } })).count !== 1) throw new ConflictException();
        const affected = await tx.transfer.findMany({ where: { agencyId: who.agencyId, vehiclePrices: { some: { vehicleId: resourceId } } }, select: { id: true, updatedAt: true } });
        for (const item of affected) await tx.transfer.update({ where: { id: item.id, agencyId: who.agencyId }, data: { isPublished: false, updatedAt: nextVersion(item.updatedAt.toISOString()) } });
        row = await tx.vehicleType.findUniqueOrThrow({ where: { id: resourceId }, select: vehicleSelect });
      } else row = await tx.vehicleType.create({ data: { ...values, agencyId: who.agencyId }, select: vehicleSelect });
      await this.audit(tx, who, 'VehicleType', row.id, resourceId ? 'SAAS_RESOURCE_UPDATE' : 'SAAS_RESOURCE_CREATE');
      return row;
    }); } catch (error) { conflict(error); }
  }

  // ---------------------------------------------------------------------------
  // TOUR LOCALIZED CONTENT / TRANSLATIONS
  // ---------------------------------------------------------------------------
  async getTourTranslations(agencyId: string, tourId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, agencyId },
      include: {
        itineraries: { orderBy: { order: 'asc' } },
        inclusions: { orderBy: { order: 'asc' } },
        exclusions: { orderBy: { order: 'asc' } },
        recommendations: { orderBy: { order: 'asc' } },
        faqs: { orderBy: { order: 'asc' } },
      },
    });
    if (!tour) throw new NotFoundException('Tour no encontrado');

    const agencyLocales = await this.prisma.agencyLocale.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'asc' },
    });

    const defaultLocale = agencyLocales.find((l) => l.isDefault)?.locale || 'es';
    const enabledLocales = agencyLocales.filter((l) => l.enabled).map((l) => l.locale);

    const currentSourceRevision = computeSourceRevision(tour);

    const translations = await this.prisma.tourLocalizedContent.findMany({
      where: { tourId },
      orderBy: { locale: 'asc' },
    });

    const formattedTranslations = translations.map((t) => ({
      id: t.id,
      locale: t.locale,
      title: t.title,
      slug: t.slug,
      description: t.description,
      itinerary: (Array.isArray(t.itinerary) ? t.itinerary : []) as Array<{ title: string; content: string }>,
      inclusions: (Array.isArray(t.inclusions) ? t.inclusions : []) as Array<{ content: string }>,
      exclusions: (Array.isArray(t.exclusions) ? t.exclusions : []) as Array<{ content: string }>,
      recommendations: (Array.isArray(t.recommendations) ? t.recommendations : []) as Array<{ content: string }>,
      faqs: (Array.isArray(t.faqs) ? t.faqs : []) as Array<{ question: string; answer: string }>,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
      focusKeyphrase: t.focusKeyphrase,
      reviewStatus: t.reviewStatus,
      generatedByAi: t.generatedByAi,
      sourceRevision: t.sourceRevision,
      updatedAt: t.updatedAt.toISOString(),
      isStale: Boolean(!t.sourceRevision || t.sourceRevision !== currentSourceRevision),
    }));

    return {
      defaultLocale,
      enabledLocales,
      currentSourceRevision,
      translations: formattedTranslations,
    };
  }

  async saveTourTranslation(who: ApiIdentity, tourId: string, locale: string, body: unknown) {
    const supportedLocales = ['es', 'en', 'pt', 'fr', 'de', 'it'];
    if (!supportedLocales.includes(locale)) {
      throw new BadRequestException('Idioma no compatible');
    }

    const data = tourTranslationSchema.parse(body);

    return await this.transaction(async (tx) => {
      // 1. Authoritative lock on Agency to serialize concurrent translation saves and avoid TOCTOU
      await tx.$queryRaw`
        SELECT id
        FROM "Agency"
        WHERE id = ${who.agencyId}
        FOR UPDATE;
      `;

      // 2. Fetch base tour and translatable content inside transaction
      const tour = await tx.tour.findFirst({
        where: { id: tourId, agencyId: who.agencyId },
        include: {
          itineraries: { orderBy: { order: 'asc' } },
          inclusions: { orderBy: { order: 'asc' } },
          exclusions: { orderBy: { order: 'asc' } },
          recommendations: { orderBy: { order: 'asc' } },
          faqs: { orderBy: { order: 'asc' } },
        },
      });
      if (!tour) throw new NotFoundException('Tour no encontrado');

      // 3. Locale must exist and be enabled for this agency
      const agencyLocale = await tx.agencyLocale.findFirst({
        where: { agencyId: who.agencyId, locale },
      });
      if (!agencyLocale) {
        throw new BadRequestException('El idioma no está configurado en tu agencia');
      }
      if (!agencyLocale.enabled) {
        throw new BadRequestException('El idioma está deshabilitado para tu agencia');
      }
      if (agencyLocale.isDefault) {
        throw new BadRequestException('El idioma principal se gestiona en la ficha base del tour');
      }

      // 4. Entitlement enforcement: total enabled locales cannot exceed maxCatalogLocales
      const entitlement = await tx.agencyEntitlement.findUnique({
        where: { agencyId: who.agencyId },
      });
      const maxLocales = entitlement?.maxCatalogLocales ?? 1;
      const enabledLocalesCount = await tx.agencyLocale.count({
        where: { agencyId: who.agencyId, enabled: true },
      });
      if (enabledLocalesCount > maxLocales) {
        throw new ForbiddenException('Has superado el límite de idiomas permitidos en tu suscripción');
      }

      // 5. Source revision concurrency check (Requirement 6 & 7)
      const currentSourceRevision = computeSourceRevision(tour);
      if (data.expectedSourceRevision !== currentSourceRevision) {
        throw new ConflictException(
          'El contenido principal cambió mientras editabas esta traducción. Recarga para revisar la versión más reciente.'
        );
      }

      // 6. Localized slug collision safety within agency + locale (Requirement 8)
      const slugCollision = await tx.tourLocalizedContent.findFirst({
        where: {
          locale,
          slug: data.slug,
          tour: { agencyId: who.agencyId },
          tourId: { not: tourId },
        },
      });
      if (slugCollision) {
        throw new ConflictException('Este enlace ya está siendo usado por otro tour en este idioma.');
      }

      // 7. Exact translation optimistic concurrency check (Requirement 5)
      const existing = await tx.tourLocalizedContent.findUnique({
        where: {
          tourId_locale: {
            tourId,
            locale,
          },
        },
      });

      if (existing) {
        if (!data.expectedUpdatedAt) {
          throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');
        }
        const expectedDate = new Date(data.expectedUpdatedAt);
        if (isNaN(expectedDate.getTime()) || existing.updatedAt.getTime() !== expectedDate.getTime()) {
          throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');
        }

        const updateResult = await tx.tourLocalizedContent.updateMany({
          where: {
            id: existing.id,
            updatedAt: existing.updatedAt,
          },
          data: {
            title: data.title,
            slug: data.slug,
            description: data.description || null,
            itinerary: (data.itinerary ? (data.itinerary as Prisma.InputJsonValue) : Prisma.DbNull),
            inclusions: (data.inclusions ? (data.inclusions as Prisma.InputJsonValue) : Prisma.DbNull),
            exclusions: (data.exclusions ? (data.exclusions as Prisma.InputJsonValue) : Prisma.DbNull),
            recommendations: (data.recommendations ? (data.recommendations as Prisma.InputJsonValue) : Prisma.DbNull),
            faqs: (data.faqs ? (data.faqs as Prisma.InputJsonValue) : Prisma.DbNull),
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
            focusKeyphrase: data.focusKeyphrase || null,
            generatedByAi: false,
            reviewStatus: 'DRAFT',
            sourceRevision: currentSourceRevision,
          },
        });

        if (updateResult.count !== 1) {
          throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');
        }

        const updated = await tx.tourLocalizedContent.findUniqueOrThrow({
          where: { id: existing.id },
        });
        await this.audit(tx, who, 'TourLocalizedContent', updated.id, 'SAAS_TRANSLATION_UPDATE');
        return updated;
      } else {
        if (data.expectedUpdatedAt) {
          throw new ConflictException('Esta traducción fue modificada por otro usuario. Recarga antes de guardar.');
        }

        const created = await tx.tourLocalizedContent.create({
          data: {
            tourId,
            locale,
            title: data.title,
            slug: data.slug,
            description: data.description || null,
            itinerary: (data.itinerary ? (data.itinerary as Prisma.InputJsonValue) : Prisma.DbNull),
            inclusions: (data.inclusions ? (data.inclusions as Prisma.InputJsonValue) : Prisma.DbNull),
            exclusions: (data.exclusions ? (data.exclusions as Prisma.InputJsonValue) : Prisma.DbNull),
            recommendations: (data.recommendations ? (data.recommendations as Prisma.InputJsonValue) : Prisma.DbNull),
            faqs: (data.faqs ? (data.faqs as Prisma.InputJsonValue) : Prisma.DbNull),
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
            focusKeyphrase: data.focusKeyphrase || null,
            generatedByAi: false,
            reviewStatus: 'DRAFT',
            sourceRevision: currentSourceRevision,
          },
        });
        await this.audit(tx, who, 'TourLocalizedContent', created.id, 'SAAS_TRANSLATION_CREATE');
        return created;
      }
    });
  }
}
