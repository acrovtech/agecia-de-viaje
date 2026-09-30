import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type ServiceResourceType, type AssignmentResourceType, type OperationalStatus } from '@repo/db/prisma';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import { conflict, parse } from '../catalog/catalog-write.service.js';

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const text = z.string().trim().min(1).max(100);
const dayRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createResourceSchema = z.object({
  type: z.enum(['GUIDE', 'DRIVER']),
  displayName: text.min(2),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(254).nullable().optional(),
  documentNumber: z.string().trim().max(40).nullable().optional(),
  userId: id.nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateResourceSchema = z.object({
  displayName: text.min(2).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(254).nullable().optional(),
  documentNumber: z.string().trim().max(40).nullable().optional(),
  userId: id.nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const createVehicleSchema = z.object({
  vehicleTypeId: id,
  internalLabel: text.min(2),
  plate: z.string().trim().min(3).max(20).toUpperCase(),
  capacity: z.number().int().min(1).max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
}).strict();

export const updateVehicleSchema = z.object({
  vehicleTypeId: id.optional(),
  internalLabel: text.min(2).optional(),
  plate: z.string().trim().min(3).max(20).toUpperCase().optional(),
  capacity: z.number().int().min(1).max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
}).strict();

export const assignResourcesSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  guideId: id.nullable().optional(),
  driverId: id.nullable().optional(),
  vehicleId: id.nullable().optional(),
  note: z.string().trim().max(1000).optional(),
}).strict();

const todayString = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async audit(
    tx: Prisma.TransactionClient,
    who: ApiIdentity,
    action: string,
    entity: string,
    entityId: string,
    details?: Record<string, unknown>,
  ) {
    await tx.adminAuditLog.create({
      data: {
        userId: who.userId,
        entity,
        entityId,
        action,
        details: {
          agencyId: who.agencyId,
          membershipId: who.membershipId,
          role: who.role,
          ...details,
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // SERVICE RESOURCES (GUIDES & DRIVERS)
  // ---------------------------------------------------------------------------

  async listResources(
    agencyId: string,
    query: { type?: string; isActive?: string; after?: string },
  ) {
    const typeEnum = query.type && ['GUIDE', 'DRIVER'].includes(query.type)
      ? (query.type as ServiceResourceType)
      : undefined;
    const activeBool = query.isActive !== undefined ? query.isActive === 'true' : undefined;
    const afterId = query.after && /^[a-zA-Z0-9_-]{1,128}$/.test(query.after) ? query.after : undefined;

    const rows = await this.prisma.serviceResource.findMany({
      where: {
        agencyId,
        ...(typeEnum ? { type: typeEnum } : {}),
        ...(activeBool !== undefined ? { isActive: activeBool } : {}),
        ...(afterId ? { id: { lt: afterId } } : {}),
      },
      orderBy: { id: 'desc' },
      take: 51,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      data: rows.slice(0, 50),
      nextCursor: rows.length > 50 ? rows[49]!.id : null,
    };
  }

  async getResource(agencyId: string, resourceId: string) {
    parse(id, resourceId);
    const row = await this.prisma.serviceResource.findFirst({
      where: { id: resourceId, agencyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!row) throw new NotFoundException('Recurso operativo no encontrado.');
    return row;
  }

  async createResource(who: ApiIdentity, body: unknown) {
    const data = parse(createResourceSchema, body);
    if (data.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.userId, agencyId: who.agencyId },
      });
      if (!user) throw new BadRequestException('El usuario vinculado no pertenece a tu agencia.');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceResource.create({
        data: {
          agencyId: who.agencyId,
          type: data.type,
          displayName: data.displayName,
          phone: data.phone || null,
          email: data.email || null,
          documentNumber: data.documentNumber || null,
          userId: data.userId || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });
      await this.audit(tx, who, 'SERVICE_RESOURCE_CREATE', 'ServiceResource', created.id, {
        type: created.type,
        displayName: created.displayName,
      });
      return created;
    });

    return this.getResource(who.agencyId, row.id);
  }

  async updateResource(who: ApiIdentity, resourceId: string, body: unknown) {
    parse(id, resourceId);
    const data = parse(updateResourceSchema, body);
    const existing = await this.getResource(who.agencyId, resourceId);

    if (data.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.userId, agencyId: who.agencyId },
      });
      if (!user) throw new BadRequestException('El usuario vinculado no pertenece a tu agencia.');
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceResource.update({
        where: { id: existing.id },
        data: {
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.documentNumber !== undefined ? { documentNumber: data.documentNumber } : {}),
          ...(data.userId !== undefined ? { userId: data.userId } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
      await this.audit(tx, who, 'SERVICE_RESOURCE_UPDATE', 'ServiceResource', updated.id, {
        displayName: updated.displayName,
        isActive: updated.isActive,
      });
    });

    return this.getResource(who.agencyId, existing.id);
  }

  // ---------------------------------------------------------------------------
  // FLEET VEHICLES (PHYSICAL UNITS)
  // ---------------------------------------------------------------------------

  async listVehicles(
    agencyId: string,
    query: { isActive?: string; vehicleTypeId?: string; after?: string },
  ) {
    const activeBool = query.isActive !== undefined ? query.isActive === 'true' : undefined;
    const vtId = query.vehicleTypeId && /^[a-zA-Z0-9_-]{1,128}$/.test(query.vehicleTypeId) ? query.vehicleTypeId : undefined;
    const afterId = query.after && /^[a-zA-Z0-9_-]{1,128}$/.test(query.after) ? query.after : undefined;

    const rows = await this.prisma.fleetVehicle.findMany({
      where: {
        agencyId,
        ...(activeBool !== undefined ? { isActive: activeBool } : {}),
        ...(vtId ? { vehicleTypeId: vtId } : {}),
        ...(afterId ? { id: { lt: afterId } } : {}),
      },
      orderBy: { id: 'desc' },
      take: 51,
      include: {
        vehicleType: { select: { id: true, name: true, code: true, maxPax: true } },
      },
    });

    return {
      data: rows.slice(0, 50),
      nextCursor: rows.length > 50 ? rows[49]!.id : null,
    };
  }

  async getVehicle(agencyId: string, vehicleId: string) {
    parse(id, vehicleId);
    const row = await this.prisma.fleetVehicle.findFirst({
      where: { id: vehicleId, agencyId },
      include: {
        vehicleType: { select: { id: true, name: true, code: true, maxPax: true } },
      },
    });
    if (!row) throw new NotFoundException('Vehículo de flota no encontrado.');
    return row;
  }

  async createVehicle(who: ApiIdentity, body: unknown) {
    const data = parse(createVehicleSchema, body);
    const vehicleType = await this.prisma.vehicleType.findFirst({
      where: { id: data.vehicleTypeId, agencyId: who.agencyId },
    });
    if (!vehicleType) throw new BadRequestException('La categoría de vehículo no pertenece a tu agencia.');

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.fleetVehicle.create({
          data: {
            agencyId: who.agencyId,
            vehicleTypeId: data.vehicleTypeId,
            internalLabel: data.internalLabel,
            plate: data.plate,
            capacity: data.capacity !== undefined ? data.capacity : vehicleType.maxPax,
            isActive: data.isActive !== undefined ? data.isActive : true,
            notes: data.notes || null,
          },
        });
        await this.audit(tx, who, 'FLEET_VEHICLE_CREATE', 'FleetVehicle', created.id, {
          internalLabel: created.internalLabel,
          plate: created.plate,
        });
        return created;
      });
      return this.getVehicle(who.agencyId, row.id);
    } catch (error) {
      return conflict(error);
    }
  }

  async updateVehicle(who: ApiIdentity, vehicleId: string, body: unknown) {
    parse(id, vehicleId);
    const data = parse(updateVehicleSchema, body);
    const existing = await this.getVehicle(who.agencyId, vehicleId);

    if (data.vehicleTypeId) {
      const vehicleType = await this.prisma.vehicleType.findFirst({
        where: { id: data.vehicleTypeId, agencyId: who.agencyId },
      });
      if (!vehicleType) throw new BadRequestException('La categoría de vehículo no pertenece a tu agencia.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.fleetVehicle.update({
          where: { id: existing.id },
          data: {
            ...(data.vehicleTypeId !== undefined ? { vehicleTypeId: data.vehicleTypeId } : {}),
            ...(data.internalLabel !== undefined ? { internalLabel: data.internalLabel } : {}),
            ...(data.plate !== undefined ? { plate: data.plate } : {}),
            ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
          },
        });
        await this.audit(tx, who, 'FLEET_VEHICLE_UPDATE', 'FleetVehicle', updated.id, {
          internalLabel: updated.internalLabel,
          plate: updated.plate,
          isActive: updated.isActive,
        });
      });
      return this.getVehicle(who.agencyId, existing.id);
    } catch (error) {
      return conflict(error);
    }
  }

  // ---------------------------------------------------------------------------
  // RESERVATION RESOURCE ASSIGNMENTS
  // ---------------------------------------------------------------------------

  async getAssignments(agencyId: string, reservationId: string) {
    parse(id, reservationId);
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, agencyId },
      select: {
        id: true,
        code: true,
        date: true,
        pax: true,
        operationStatus: true,
        vehicleTypeId: true,
        updatedAt: true,
        resourceAssignments: {
          include: {
            serviceResource: { select: { id: true, displayName: true, phone: true, type: true } },
            fleetVehicle: {
              include: {
                vehicleType: { select: { id: true, name: true, maxPax: true } },
              },
            },
          },
        },
      },
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada.');

    const guideAssign = reservation.resourceAssignments.find((a) => a.resourceType === 'GUIDE');
    const driverAssign = reservation.resourceAssignments.find((a) => a.resourceType === 'DRIVER');
    const vehicleAssign = reservation.resourceAssignments.find((a) => a.resourceType === 'VEHICLE');

    return {
      reservationId: reservation.id,
      serviceDate: reservation.date.toISOString().slice(0, 10),
      expectedUpdatedAt: reservation.updatedAt.toISOString(),
      guide: guideAssign?.serviceResource
        ? {
            id: guideAssign.serviceResource.id,
            displayName: guideAssign.serviceResource.displayName,
            phone: guideAssign.serviceResource.phone,
          }
        : null,
      driver: driverAssign?.serviceResource
        ? {
            id: driverAssign.serviceResource.id,
            displayName: driverAssign.serviceResource.displayName,
            phone: driverAssign.serviceResource.phone,
          }
        : null,
      vehicle: vehicleAssign?.fleetVehicle
        ? {
            id: vehicleAssign.fleetVehicle.id,
            internalLabel: vehicleAssign.fleetVehicle.internalLabel,
            plate: vehicleAssign.fleetVehicle.plate,
            vehicleTypeName: vehicleAssign.fleetVehicle.vehicleType.name,
            capacity: vehicleAssign.fleetVehicle.capacity ?? vehicleAssign.fleetVehicle.vehicleType.maxPax,
          }
        : null,
    };
  }

  async assignResources(who: ApiIdentity, reservationId: string, body: unknown) {
    parse(id, reservationId);
    const data = parse(assignResourcesSchema, body);

    try {
      await this.prisma.$transaction(
        async (tx) => {
          // 1. Authoritative lookup of the reservation
          const reservation = await tx.reservation.findFirst({
            where: { id: reservationId, agencyId: who.agencyId },
            include: {
              resourceAssignments: true,
            },
          });
          if (!reservation) throw new NotFoundException('Reserva no encontrada.');

          // 2. Optimistic concurrency check
          if (reservation.updatedAt.toISOString() !== data.expectedUpdatedAt) {
            throw new ConflictException('La reserva fue modificada por otro usuario. Recarga los datos.');
          }

          // 3. Operational status validation
          if (reservation.operationStatus === 'CANCELLED') {
            throw new BadRequestException('No se pueden asignar recursos a una reserva cancelada.');
          }
          if (reservation.operationStatus === 'COMPLETED') {
            throw new BadRequestException('No se pueden modificar recursos de una reserva completada.');
          }

          const serviceDate = reservation.date;

          // 4. Validate Guide (if changing or setting)
          if (data.guideId !== undefined && data.guideId !== null) {
            const guide = await tx.serviceResource.findFirst({
              where: { id: data.guideId, agencyId: who.agencyId, type: 'GUIDE' },
            });
            if (!guide) throw new NotFoundException('El guía no pertenece a tu agencia.');
            if (!guide.isActive) throw new BadRequestException('El guía seleccionado está inactivo.');

            // Race-safe conflict check: is this guide already assigned to another reservation on this serviceDate?
            const conflict = await tx.reservationResourceAssignment.findFirst({
              where: {
                serviceResourceId: guide.id,
                serviceDate,
                reservationId: { not: reservation.id },
              },
            });
            if (conflict) {
              throw new ConflictException('El guía ya se encuentra asignado a otra reserva en esta fecha de servicio.');
            }
          }

          // 5. Validate Driver (if changing or setting)
          if (data.driverId !== undefined && data.driverId !== null) {
            const driver = await tx.serviceResource.findFirst({
              where: { id: data.driverId, agencyId: who.agencyId, type: 'DRIVER' },
            });
            if (!driver) throw new NotFoundException('El conductor no pertenece a tu agencia.');
            if (!driver.isActive) throw new BadRequestException('El conductor seleccionado está inactivo.');

            // Race-safe conflict check
            const conflict = await tx.reservationResourceAssignment.findFirst({
              where: {
                serviceResourceId: driver.id,
                serviceDate,
                reservationId: { not: reservation.id },
              },
            });
            if (conflict) {
              throw new ConflictException('El conductor ya se encuentra asignado a otra reserva en esta fecha de servicio.');
            }
          }

          // 6. Validate Vehicle (if changing or setting)
          if (data.vehicleId !== undefined && data.vehicleId !== null) {
            const vehicle = await tx.fleetVehicle.findFirst({
              where: { id: data.vehicleId, agencyId: who.agencyId },
              include: { vehicleType: true },
            });
            if (!vehicle) throw new NotFoundException('El vehículo no pertenece a tu agencia.');
            if (!vehicle.isActive) throw new BadRequestException('El vehículo seleccionado está inactivo.');

            // Vehicle Category Compatibility check (for private transfers or specific vehicle reservations)
            if (reservation.vehicleTypeId && vehicle.vehicleTypeId !== reservation.vehicleTypeId) {
              throw new BadRequestException('El vehículo no coincide con la categoría contratada en la reserva.');
            }

            // Capacity check
            const authoritativeCapacity = vehicle.capacity ?? vehicle.vehicleType.maxPax;
            if (authoritativeCapacity < reservation.pax) {
              throw new BadRequestException(
                `Capacidad insuficiente: el vehículo tiene capacidad para ${authoritativeCapacity} y la reserva requiere ${reservation.pax} pasajeros.`,
              );
            }

            // Race-safe conflict check
            const conflict = await tx.reservationResourceAssignment.findFirst({
              where: {
                fleetVehicleId: vehicle.id,
                serviceDate,
                reservationId: { not: reservation.id },
              },
            });
            if (conflict) {
              throw new ConflictException('El vehículo ya se encuentra asignado a otra reserva en esta fecha de servicio.');
            }
          }

          // 7. Apply mutations for each resource type
          const actionsRecorded: string[] = [];

          // Guide
          if (data.guideId !== undefined) {
            if (data.guideId === null) {
              await tx.reservationResourceAssignment.deleteMany({
                where: { reservationId: reservation.id, resourceType: 'GUIDE' },
              });
              actionsRecorded.push('Guía desasignado');
            } else {
              await tx.reservationResourceAssignment.upsert({
                where: { reservationId_resourceType: { reservationId: reservation.id, resourceType: 'GUIDE' } },
                create: {
                  agencyId: who.agencyId,
                  reservationId: reservation.id,
                  resourceType: 'GUIDE',
                  serviceResourceId: data.guideId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                },
                update: {
                  serviceResourceId: data.guideId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                  updatedAt: new Date(),
                },
              });
              actionsRecorded.push(`Guía asignado: ${data.guideId}`);
            }
          }

          // Driver
          if (data.driverId !== undefined) {
            if (data.driverId === null) {
              await tx.reservationResourceAssignment.deleteMany({
                where: { reservationId: reservation.id, resourceType: 'DRIVER' },
              });
              actionsRecorded.push('Conductor desasignado');
            } else {
              await tx.reservationResourceAssignment.upsert({
                where: { reservationId_resourceType: { reservationId: reservation.id, resourceType: 'DRIVER' } },
                create: {
                  agencyId: who.agencyId,
                  reservationId: reservation.id,
                  resourceType: 'DRIVER',
                  serviceResourceId: data.driverId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                },
                update: {
                  serviceResourceId: data.driverId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                  updatedAt: new Date(),
                },
              });
              actionsRecorded.push(`Conductor asignado: ${data.driverId}`);
            }
          }

          // Vehicle
          if (data.vehicleId !== undefined) {
            if (data.vehicleId === null) {
              await tx.reservationResourceAssignment.deleteMany({
                where: { reservationId: reservation.id, resourceType: 'VEHICLE' },
              });
              actionsRecorded.push('Vehículo desasignado');
            } else {
              await tx.reservationResourceAssignment.upsert({
                where: { reservationId_resourceType: { reservationId: reservation.id, resourceType: 'VEHICLE' } },
                create: {
                  agencyId: who.agencyId,
                  reservationId: reservation.id,
                  resourceType: 'VEHICLE',
                  fleetVehicleId: data.vehicleId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                },
                update: {
                  fleetVehicleId: data.vehicleId,
                  assignedById: who.userId,
                  serviceDate,
                  notes: data.note || null,
                  updatedAt: new Date(),
                },
              });
              actionsRecorded.push(`Vehículo asignado: ${data.vehicleId}`);
            }
          }

          // 8. Update Reservation updatedAt to enforce concurrency version increment
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { updatedAt: new Date() },
          });

          // 9. Operational timeline event
          const eventNote = actionsRecorded.length
            ? `Recursos operativos actualizados: ${actionsRecorded.join(', ')}.${data.note ? ` Nota: ${data.note}` : ''}`
            : `Recursos operativos verificados sin cambios.${data.note ? ` Nota: ${data.note}` : ''}`;

          await tx.reservationEvent.create({
            data: {
              reservationId: reservation.id,
              actorId: who.userId,
              actorLabel: who.email,
              fromStatus: reservation.operationStatus,
              toStatus: reservation.operationStatus ?? 'PENDING',
              note: eventNote,
            },
          });

          // 10. Admin Audit Log
          await this.audit(tx, who, 'RESERVATION_RESOURCE_ASSIGNMENT', 'Reservation', reservation.id, {
            actions: actionsRecorded,
            note: data.note,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      conflict(error);
    }

    return this.getAssignments(who.agencyId, reservationId);
  }

  // ---------------------------------------------------------------------------
  // DAILY DISPATCH VIEW
  // ---------------------------------------------------------------------------

  async getDispatch(
    agencyId: string,
    query: { date?: string; status?: string; missing?: string },
  ) {
    const targetDate = query.date && dayRegex.test(query.date) ? query.date : todayString();
    const startDate = new Date(`${targetDate}T00:00:00.000Z`);
    const statusEnum = query.status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(query.status)
      ? (query.status as OperationalStatus)
      : undefined;

    const reservations = await this.prisma.reservation.findMany({
      where: {
        agencyId,
        date: startDate,
        ...(statusEnum ? { operationStatus: statusEnum } : {}),
      },
      select: {
        id: true,
        code: true,
        serviceTitle: true,
        serviceType: true,
        pax: true,
        operationStatus: true,
        pickupHotel: true,
        pickupTime: true,
        transferId: true,
        tourId: true,
        resourceAssignments: {
          include: {
            serviceResource: { select: { id: true, displayName: true, phone: true, type: true } },
            fleetVehicle: {
              include: {
                vehicleType: { select: { id: true, name: true, maxPax: true } },
              },
            },
          },
        },
      },
      orderBy: [{ pickupTime: 'asc' }, { id: 'asc' }],
    });

    const items = reservations.map((r) => {
      const guideAssign = r.resourceAssignments.find((a) => a.resourceType === 'GUIDE');
      const driverAssign = r.resourceAssignments.find((a) => a.resourceType === 'DRIVER');
      const vehicleAssign = r.resourceAssignments.find((a) => a.resourceType === 'VEHICLE');

      const isTransfer = Boolean(r.transferId || r.serviceType === 'private');
      const isTour = Boolean(r.tourId);

      const guideMissing = isTour && !guideAssign;
      const driverMissing = isTransfer && !driverAssign;
      const vehicleMissing = (isTransfer || r.serviceType === 'private') && !vehicleAssign;

      return {
        reservationId: r.id,
        code: r.code,
        serviceTitle: r.serviceTitle,
        serviceType: r.serviceType,
        pax: r.pax,
        operationStatus: r.operationStatus,
        pickupHotel: r.pickupHotel,
        pickupTime: r.pickupTime,
        guide: guideAssign?.serviceResource
          ? {
              id: guideAssign.serviceResource.id,
              displayName: guideAssign.serviceResource.displayName,
              phone: guideAssign.serviceResource.phone,
            }
          : null,
        driver: driverAssign?.serviceResource
          ? {
              id: driverAssign.serviceResource.id,
              displayName: driverAssign.serviceResource.displayName,
              phone: driverAssign.serviceResource.phone,
            }
          : null,
        vehicle: vehicleAssign?.fleetVehicle
          ? {
              id: vehicleAssign.fleetVehicle.id,
              internalLabel: vehicleAssign.fleetVehicle.internalLabel,
              plate: vehicleAssign.fleetVehicle.plate,
              vehicleTypeName: vehicleAssign.fleetVehicle.vehicleType.name,
              capacity: vehicleAssign.fleetVehicle.capacity ?? vehicleAssign.fleetVehicle.vehicleType.maxPax,
            }
          : null,
        missing: {
          guide: guideMissing,
          driver: driverMissing,
          vehicle: vehicleMissing,
          any: guideMissing || driverMissing || vehicleMissing,
        },
      };
    });

    const filtered = query.missing
      ? items.filter((item) => {
          if (query.missing === 'GUIDE') return item.missing.guide;
          if (query.missing === 'DRIVER') return item.missing.driver;
          if (query.missing === 'VEHICLE') return item.missing.vehicle;
          if (query.missing === 'ANY') return item.missing.any;
          return true;
        })
      : items;

    return {
      date: targetDate,
      total: filtered.length,
      data: filtered,
    };
  }
}
