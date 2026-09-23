import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import { TenantContext } from '../tenant/tenant.types.js';
import {
  TourDetailDto,
  TourListDto,
  TourSummaryDto,
  TransferListDto,
  TransferSummaryDto,
} from './catalog.dto.js';

const publicTourSelect = {
  slug: true, title: true, description: true, duration: true, cardImage: true,
  region: true, hasSharedService: true, hasPrivateService: true, sharedPrice: true,
} satisfies Prisma.TourSelect;
type PublicTour = Prisma.TourGetPayload<{ select: typeof publicTourSelect }>;

function toSummary(tour: PublicTour): TourSummaryDto {
  return {
    slug: tour.slug, title: tour.title, description: tour.description,
    duration: tour.duration, cardImage: tour.cardImage, region: tour.region,
    hasSharedService: tour.hasSharedService, hasPrivateService: tour.hasPrivateService,
    sharedPrice: tour.hasSharedService ? tour.sharedPrice : null,
    currency: 'USD',
  };
}

const publicTourDetailSelect = {
  id: true,
  slug: true, title: true, description: true, duration: true, cardImage: true,
  bannerImage: true, region: true, altitude: true, transport: true,
  groupSize: true, difficulty: true, mapImage: true,
  hasSharedService: true, hasPrivateService: true, sharedPrice: true,
  metaTitle: true, metaDescription: true,
  categories: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    select: { id: true, url: true, alt: true, order: true },
    orderBy: { order: 'asc' },
  },
  itineraries: {
    select: { id: true, title: true, content: true, order: true },
    orderBy: { order: 'asc' },
  },
  inclusions: {
    select: { id: true, content: true, order: true },
    orderBy: { order: 'asc' },
  },
  exclusions: {
    select: { id: true, content: true, order: true },
    orderBy: { order: 'asc' },
  },
  recommendations: {
    select: { id: true, content: true, order: true },
    orderBy: { order: 'asc' },
  },
  faqs: {
    select: { id: true, question: true, answer: true, order: true },
    orderBy: { order: 'asc' },
  },
  privatePricing: {
    select: { id: true, pax: true, price: true },
    orderBy: { pax: 'asc' },
  },
} satisfies Prisma.TourSelect;

type PublicTourDetail = Prisma.TourGetPayload<{ select: typeof publicTourDetailSelect }>;

function toTourDetail(tour: PublicTourDetail): TourDetailDto {
  return {
    ...toSummary(tour),
    id: tour.id,
    bannerImage: tour.bannerImage,
    altitude: tour.altitude,
    transport: tour.transport,
    groupSize: tour.groupSize,
    difficulty: tour.difficulty,
    mapImage: tour.mapImage,
    metaTitle: tour.metaTitle,
    metaDescription: tour.metaDescription,
    categories: tour.categories,
    images: tour.images,
    itineraries: tour.itineraries,
    inclusions: tour.inclusions,
    exclusions: tour.exclusions,
    recommendations: tour.recommendations,
    faqs: tour.faqs,
    privatePricing: tour.hasPrivateService ? tour.privatePricing : [],
  };
}

const publicTransferSelect = {
  id: true,
  slug: true, title: true, origin: true, destination: true,
  duration: true, tripType: true, description: true, bannerImage: true,
  hasSharedService: true, sharedPrice: true, hasPrivateService: true,
  vehiclePrices: {
    select: {
      price: true,
      vehicle: {
        select: {
          id: true,
          code: true,
          name: true,
          subtitle: true,
          maxPax: true,
          maxLuggage: true,
          image: true,
          features: true,
        },
      },
    },
  },
} satisfies Prisma.TransferSelect;

type PublicTransfer = Prisma.TransferGetPayload<{ select: typeof publicTransferSelect }>;

function toTransferSummary(t: PublicTransfer): TransferSummaryDto {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    origin: t.origin,
    destination: t.destination,
    duration: t.duration,
    tripType: t.tripType,
    description: t.description,
    bannerImage: t.bannerImage,
    hasSharedService: t.hasSharedService,
    sharedPrice: t.hasSharedService ? t.sharedPrice : null,
    hasPrivateService: t.hasPrivateService,
    vehicleOptions: (t.hasPrivateService ? t.vehiclePrices : []).map((vp) => ({
      id: vp.vehicle.id,
      vehicleCode: vp.vehicle.code,
      vehicleName: vp.vehicle.name,
      subtitle: vp.vehicle.subtitle,
      maxPax: vp.vehicle.maxPax,
      maxLuggage: vp.vehicle.maxLuggage,
      image: vp.vehicle.image,
      price: vp.price,
      features: vp.vehicle.features || [],
    })),
    currency: 'USD',
  };
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  private async resolveAgencyId(tenantOrStorefront: TenantContext | string): Promise<string> {
    if (typeof tenantOrStorefront === 'object' && tenantOrStorefront !== null && 'agencyId' in tenantOrStorefront) {
      return tenantOrStorefront.agencyId;
    }
    const storefront = String(tenantOrStorefront);
    if (!this.config.publicAgencySlugs.includes(storefront)) throw new NotFoundException();
    const agency = await this.prisma.agency.findFirst({
      where: { slug: storefront, isActive: true }, select: { id: true },
    });
    if (!agency) throw new NotFoundException();
    return agency.id;
  }

  async list(tenantOrStorefront: TenantContext | string, page: number, limit: number): Promise<TourListDto> {
    const agencyId = await this.resolveAgencyId(tenantOrStorefront);
    const tours = await this.prisma.tour.findMany({
      where: { agencyId, isPublished: true, agency: { isActive: true } },
      select: publicTourSelect,
      orderBy: { id: 'asc' }, skip: (page - 1) * limit, take: limit + 1,
    });
    return {
      data: tours.slice(0, limit).map(toSummary),
      pagination: { page, limit, hasMore: tours.length > limit },
    };
  }

  async detail(tenantOrStorefront: TenantContext | string, slug: string): Promise<TourDetailDto> {
    const agencyId = await this.resolveAgencyId(tenantOrStorefront);
    const tour = await this.prisma.tour.findFirst({
      where: { agencyId, slug, isPublished: true, agency: { isActive: true } },
      select: { ...publicTourDetailSelect, categories: { ...publicTourDetailSelect.categories, where: { agencyId } } },
    });
    if (!tour) throw new NotFoundException();
    return toTourDetail(tour);
  }

  async listTransfers(tenantOrStorefront: TenantContext | string, page: number, limit: number): Promise<TransferListDto> {
    const agencyId = await this.resolveAgencyId(tenantOrStorefront);
    const transfers = await this.prisma.transfer.findMany({
      where: { agencyId, isPublished: true, isActive: true, agency: { isActive: true } },
      select: { ...publicTransferSelect, vehiclePrices: { ...publicTransferSelect.vehiclePrices, where: { vehicle: { agencyId, isActive: true } } } },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit + 1,
    });
    return {
      data: transfers.slice(0, limit).map(toTransferSummary),
      pagination: { page, limit, hasMore: transfers.length > limit },
    };
  }

  async detailTransfer(tenantOrStorefront: TenantContext | string, slug: string): Promise<TransferSummaryDto> {
    const agencyId = await this.resolveAgencyId(tenantOrStorefront);
    const transfer = await this.prisma.transfer.findFirst({
      where: { agencyId, slug, isPublished: true, isActive: true, agency: { isActive: true } },
      select: { ...publicTransferSelect, vehiclePrices: { ...publicTransferSelect.vehiclePrices, where: { vehicle: { agencyId, isActive: true } } } },
    });
    if (!transfer) throw new NotFoundException();
    return toTransferSummary(transfer);
  }
}
