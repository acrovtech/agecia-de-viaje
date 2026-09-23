import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db/prisma';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';

export const text = z.string().trim().min(1).max(200);
export const image = z.string().max(2000).refine((value) => {
  if (/^\/(?!\/)[a-zA-Z0-9/_ .%-]+$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
});
export const money = z.number().finite().positive().max(1_000_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001);
const common = {
  title: text, slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  duration: text, hasSharedService: z.boolean(), sharedPrice: money.nullable(),
};
const tour = z.object({
  ...common, description: z.string().trim().min(1).max(20000), bannerImage: image, cardImage: image,
  region: z.string().trim().max(200).nullable(),
}).strict();
const transfer = z.object({
  ...common, description: z.string().trim().max(20000).nullable(), bannerImage: image.nullable(),
  origin: text, destination: text, tripType: z.enum(['Solo ida', 'Ida y vuelta']), isActive: z.boolean(),
}).strict();
const version = { expectedUpdatedAt: z.string().datetime() };
export const tourSelect = {
  isPublished: true,
  id: true, title: true, slug: true, duration: true, description: true, bannerImage: true, cardImage: true,
  region: true, hasSharedService: true, sharedPrice: true, hasPrivateService: true, updatedAt: true,
} satisfies Prisma.TourSelect;
export const transferSelect = {
  isPublished: true,
  id: true, title: true, slug: true, duration: true, description: true, bannerImage: true,
  origin: true, destination: true, tripType: true, isActive: true,
  hasSharedService: true, sharedPrice: true, hasPrivateService: true, updatedAt: true,
} satisfies Prisma.TransferSelect;

export function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException();
  return result.data;
}
function serviceMode(data: { hasSharedService: boolean; sharedPrice: number | null }) {
  if (data.hasSharedService && data.sharedPrice === null) throw new BadRequestException();
  if (!data.hasSharedService) data.sharedPrice = null;
}
export function conflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new ConflictException();
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException();
  throw error;
}

@Injectable()
export class CatalogWriteService {
  constructor(private readonly prisma: PrismaService) {}

  async tour(agencyId: string, id: string) {
    const record = await this.prisma.tour.findFirst({ where: { id, agencyId }, select: tourSelect });
    if (!record) throw new NotFoundException();
    return record;
  }
  async transfer(agencyId: string, id: string) {
    const record = await this.prisma.transfer.findFirst({ where: { id, agencyId }, select: transferSelect });
    if (!record) throw new NotFoundException();
    return record;
  }

  private audit(tx: Prisma.TransactionClient, identity: ApiIdentity, entity: string, id: string, action: string, fields: string[]) {
    return tx.adminAuditLog.create({ data: {
      userId: identity.userId, entity, entityId: id, action,
      details: { agencyId: identity.agencyId, membershipId: identity.membershipId, actorId: identity.userId, role: identity.role, fields },
    } });
  }

  async createTour(identity: ApiIdentity, body: unknown) {
    const data = parse(tour, body);
    serviceMode(data);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const record = await tx.tour.create({ data: { ...data, agencyId: identity.agencyId, hasPrivateService: false }, select: tourSelect });
        await this.audit(tx, identity, 'Tour', record.id, 'SAAS_CATALOG_CREATE', Object.keys(data));
        return record;
      });
    } catch (error) { conflict(error); }
  }

  async updateTour(identity: ApiIdentity, id: string, body: unknown) {
    const { expectedUpdatedAt, ...data } = parse(tour.extend(version), body);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.tour.findFirst({ where: { id, agencyId: identity.agencyId }, select: { hasPrivateService: true } });
        if (!existing) throw new NotFoundException();
        serviceMode(data);
        const expected = new Date(expectedUpdatedAt);
        const changed = await tx.tour.updateMany({
          where: { id, agencyId: identity.agencyId, updatedAt: expected },
          data: { ...data, isPublished: false, updatedAt: new Date(Math.max(Date.now(), expected.getTime() + 1)) },
        });
        if (changed.count !== 1) throw new ConflictException();
        await this.audit(tx, identity, 'Tour', id, 'SAAS_CATALOG_UPDATE', Object.keys(data));
        return tx.tour.findFirstOrThrow({ where: { id, agencyId: identity.agencyId }, select: tourSelect });
      });
    } catch (error) { conflict(error); }
  }

  async createTransfer(identity: ApiIdentity, body: unknown) {
    const data = parse(transfer, body);
    serviceMode(data);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const record = await tx.transfer.create({ data: { ...data, agencyId: identity.agencyId, hasPrivateService: false }, select: transferSelect });
        await this.audit(tx, identity, 'Transfer', record.id, 'SAAS_CATALOG_CREATE', Object.keys(data));
        return record;
      });
    } catch (error) { conflict(error); }
  }

  async updateTransfer(identity: ApiIdentity, id: string, body: unknown) {
    const { expectedUpdatedAt, ...data } = parse(transfer.extend(version), body);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.transfer.findFirst({ where: { id, agencyId: identity.agencyId }, select: { hasPrivateService: true } });
        if (!existing) throw new NotFoundException();
        serviceMode(data);
        const expected = new Date(expectedUpdatedAt);
        const changed = await tx.transfer.updateMany({
          where: { id, agencyId: identity.agencyId, updatedAt: expected },
          data: { ...data, isPublished: false, updatedAt: new Date(Math.max(Date.now(), expected.getTime() + 1)) },
        });
        if (changed.count !== 1) throw new ConflictException();
        await this.audit(tx, identity, 'Transfer', id, 'SAAS_CATALOG_UPDATE', Object.keys(data));
        return tx.transfer.findFirstOrThrow({ where: { id, agencyId: identity.agencyId }, select: transferSelect });
      });
    } catch (error) { conflict(error); }
  }
}
