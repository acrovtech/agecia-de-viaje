import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma, type OperationalStatus } from '@repo/db/prisma';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import { money, parse, conflict } from '../catalog/catalog-write.service.js';

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const name = z.string().trim().min(1).max(100);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
});
const selection = z.object({
  kind: z.enum(['TOUR', 'TRANSFER']), serviceId: id, modality: z.enum(['shared', 'private']),
  date: day, pax: z.number().int().min(1).max(100), vehicleId: id.nullable(),
}).strict().refine((v) => (v.kind === 'TRANSFER' && v.modality === 'private') ? v.vehicleId !== null : v.vehicleId === null);
const passenger = z.object({ firstName: name, lastName: name, docType: z.enum(['DNI', 'PASAPORTE', 'CE']), docNumber: z.string().trim().max(40) }).strict();
const creation = z.object({
  selection, requestKey: z.string().uuid(), quoteHash: z.string().regex(/^[a-f0-9]{64}$/),
  customerFirstName: name, customerLastName: name, customerEmail: z.string().trim().toLowerCase().email().max(254),
  customerPhone: z.string().trim().min(5).max(40), passengers: z.array(passenger).min(1).max(100),
  pickupHotel: z.string().trim().max(300), pickupTime: z.union([z.literal(''), z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]),
  specialRequirements: z.string().trim().max(2000),
}).strict().refine((v) => v.passengers.length === v.selection.pax).refine((v) => {
  const docs = v.passengers.filter((p) => p.docNumber).map((p) => `${p.docType}:${p.docNumber.toUpperCase()}`);
  return new Set(docs).size === docs.length;
});
const statusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);
const digest = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Service dates are calendar days in Peru, stored as UTC midnight (not departure timestamps).
const today = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
const summarySelect = {
  id: true, code: true, operationStatus: true, bookingStatus: true, paymentStatus: true, source: true,
  serviceTitle: true, date: true, pax: true, currency: true, totalMinor: true, totalPrice: true,
  customerFirstName: true, customerLastName: true, updatedAt: true, createdAt: true,
} satisfies Prisma.ReservationSelect;
const detailSelect = {
  ...summarySelect, serviceType: true, unitPriceMinor: true, pricingUnit: true, vehicleName: true,
  customerEmail: true, customerPhone: true, pickupHotel: true, pickupTime: true, specialRequirements: true,
  passengers: { select: { firstName: true, lastName: true, docType: true, docNumber: true } },
  events: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, actorLabel: true, fromStatus: true, toStatus: true, note: true, createdAt: true } },
} satisfies Prisma.ReservationSelect;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async price(tx: Prisma.TransactionClient, agencyId: string, input: z.infer<typeof selection>) {
    if (input.date < today()) throw new BadRequestException('La fecha debe ser hoy o posterior.');
    const row = input.kind === 'TOUR'
      ? await tx.tour.findFirst({ where: { id: input.serviceId, agencyId, isPublished: true }, include: { privatePricing: true } })
      : await tx.transfer.findFirst({ where: { id: input.serviceId, agencyId, isPublished: true, isActive: true }, include: { vehiclePrices: { include: { vehicle: true } } } });
    if (!row) throw new NotFoundException();
    let amount: number | null = null;
    let vehicleName: string | null = null;
    let pricingUnit: 'PER_TRAVELER' | 'GROUP' = 'PER_TRAVELER';
    if (input.modality === 'shared') {
      if (!row.hasSharedService) throw new BadRequestException();
      amount = row.sharedPrice;
    } else {
      if (!row.hasPrivateService) throw new BadRequestException();
      if ('privatePricing' in row) {
        // Exact tier: never infer a price for an unconfigured passenger count.
        const tiers = row.privatePricing.filter((p) => p.pax === input.pax);
        if (tiers.length !== 1) throw new BadRequestException('No hay tarifa para esa cantidad de pasajeros.');
        amount = tiers[0]!.price;
      } else {
        const rate = row.vehiclePrices.find((p) => p.vehicleId === input.vehicleId && p.vehicle.agencyId === agencyId && p.vehicle.isActive);
        if (!rate || input.pax > rate.vehicle.maxPax) throw new BadRequestException('Vehículo inválido o capacidad excedida.');
        amount = rate.price; vehicleName = rate.vehicle.name; pricingUnit = 'GROUP';
      }
    }
    if (!money.safeParse(amount).success) throw new BadRequestException('Tarifa inválida.');
    const unitPriceMinor = Math.round(amount! * 100);
    const totalMinor = unitPriceMinor * (pricingUnit === 'GROUP' ? 1 : input.pax);
    if (!Number.isSafeInteger(totalMinor) || totalMinor > 2_147_483_647) throw new BadRequestException();
    const result = { ...input, title: row.title, vehicleName, pricingUnit, unitPriceMinor, totalMinor, currency: 'USD' as const };
    return { ...result, quoteHash: digest({ agencyId, ...result, updatedAt: row.updatedAt }) };
  }

  quote(agencyId: string, body: unknown) {
    const data = parse(selection, body);
    return this.prisma.$transaction((tx) => this.price(tx, agencyId, data));
  }

  async list(agencyId: string, query: unknown) {
    const { after, status } = parse(z.object({ after: id.optional(), status: statusSchema.optional() }).strict(), query);
    const rows = await this.prisma.reservation.findMany({ where: { agencyId, ...(after ? { id: { lt: after } } : {}), ...(status ? { operationStatus: status } : {}) }, select: summarySelect, orderBy: { id: 'desc' }, take: 31 });
    return { data: rows.slice(0, 30), nextCursor: rows.length > 30 ? rows[29]!.id : null };
  }

  async detail(agencyId: string, reservationId: string) {
    const row = await this.prisma.reservation.findFirst({ where: { agencyId, id: parse(id, reservationId) }, select: detailSelect });
    if (!row) throw new NotFoundException();
    return row;
  }

  private audit(tx: Prisma.TransactionClient, who: ApiIdentity, reservationId: string, action: string) {
    return tx.adminAuditLog.create({ data: { userId: who.userId, entity: 'Reservation', entityId: reservationId, action, details: { agencyId: who.agencyId, membershipId: who.membershipId, role: who.role } } });
  }

  async create(who: ApiIdentity, body: unknown) {
    const data = parse(creation, body);
    const requestHash = digest(data);
    const where = { agencyId_requestKey: { agencyId: who.agencyId, requestKey: data.requestKey } };
    const replay = async () => {
      const existing = await this.prisma.reservation.findUnique({ where, select: { id: true, requestHash: true } });
      if (!existing) return null;
      if (existing.requestHash !== requestHash) throw new ConflictException('La solicitud ya se utilizó con otros datos.');
      return this.detail(who.agencyId, existing.id);
    };
    const existing = await replay();
    if (existing) return existing;
    let reservationId: string;
    try {
      reservationId = await this.prisma.$transaction(async (tx) => {
        const quote = await this.price(tx, who.agencyId, data.selection);
        if (quote.quoteHash !== data.quoteHash) throw new ConflictException('La tarifa cambió. Cotiza nuevamente.');
        const row = await tx.reservation.create({ data: {
          agencyId: who.agencyId, source: 'MANUAL_SAAS', operationStatus: 'PENDING',
          tourId: quote.kind === 'TOUR' ? quote.serviceId : null, transferId: quote.kind === 'TRANSFER' ? quote.serviceId : null,
          vehicleTypeId: quote.vehicleId, serviceType: quote.modality, date: new Date(`${quote.date}T00:00:00.000Z`), pax: quote.pax,
          serviceTitle: quote.title, vehicleName: quote.vehicleName, pricingUnit: quote.pricingUnit,
          unitPriceMinor: quote.unitPriceMinor, totalMinor: quote.totalMinor, totalPrice: quote.totalMinor / 100, currency: quote.currency,
          customerFirstName: data.customerFirstName, customerLastName: data.customerLastName, customerEmail: data.customerEmail, customerPhone: data.customerPhone,
          pickupHotel: data.pickupHotel || null, pickupTime: data.pickupTime || null, specialRequirements: data.specialRequirements || null,
          passengers: { create: data.passengers }, requestKey: data.requestKey, requestHash,
          events: { create: { actorId: who.userId, actorLabel: who.email, toStatus: 'PENDING', note: 'Reserva manual creada.' } },
        }, select: { id: true } });
        await this.audit(tx, who, row.id, 'SAAS_RESERVATION_CREATE');
        return row.id;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) {
        const repeated = await replay();
        if (repeated) return repeated;
      }
      return conflict(error);
    }
    return this.detail(who.agencyId, reservationId);
  }

  async transition(who: ApiIdentity, reservationId: string, body: unknown) {
    parse(id, reservationId);
    const data = parse(z.object({ expectedUpdatedAt: z.string().datetime(), status: statusSchema, note: z.string().trim().min(3).max(1000) }).strict(), body);
    const allowed: Record<OperationalStatus, OperationalStatus[]> = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
    try {
      await this.prisma.$transaction(async (tx) => {
        const row = await tx.reservation.findFirst({ where: { id: reservationId, agencyId: who.agencyId }, select: { operationStatus: true, updatedAt: true, date: true, source: true } });
        if (!row) throw new NotFoundException();
        if (row.updatedAt.toISOString() !== data.expectedUpdatedAt) throw new ConflictException();
        if (row.source !== 'MANUAL_SAAS' || !row.operationStatus || !allowed[row.operationStatus].includes(data.status)) throw new BadRequestException('Transición no permitida.');
        if (data.status === 'COMPLETED' && row.date.toISOString().slice(0, 10) > today()) throw new BadRequestException('El servicio aún no ocurrió.');
        const changed = await tx.reservation.updateMany({ where: { id: reservationId, agencyId: who.agencyId, updatedAt: row.updatedAt }, data: {
          operationStatus: data.status, updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)),
          bookingStatus: data.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
          ...(data.status === 'CANCELLED' ? { status: 'CANCELLED' as const } : {}),
        } });
        if (changed.count !== 1) throw new ConflictException();
        await tx.reservationEvent.create({ data: { reservationId, actorId: who.userId, actorLabel: who.email, fromStatus: row.operationStatus, toStatus: data.status, note: data.note } });
        await this.audit(tx, who, reservationId, 'SAAS_RESERVATION_STATUS');
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) { conflict(error); }
    return this.detail(who.agencyId, reservationId);
  }
}
