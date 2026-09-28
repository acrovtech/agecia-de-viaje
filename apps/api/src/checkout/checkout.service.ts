import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, OperationalStatus, ReservationPaymentStatus, ReservationStatus } from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import { TenantContext } from '../tenant/tenant.types.js';
import { PaymentsService } from '../payments/payments.service.js';
import {
  CheckoutResponseDto,
  CreateCheckoutDto,
} from './checkout.dto.js';

@Injectable()
export class CheckoutService {
  private readonly inFlightPaymentSessions = new Map<string, Promise<{ formToken: string | null }>>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async getOrCreatePaymentSession(
    reservation: {
      id: string;
      code: string | null;
      paymentFormToken?: string | null;
      paymentFormTokenCreatedAt?: Date | null;
      paymentSessionStatus?: string | null;
      paymentStatus: ReservationPaymentStatus;
      customerEmail: string;
      customerFirstName: string;
      customerLastName: string;
      customerPhone: string;
    },
    amountMinor: number,
  ): Promise<string | null> {
    // 1. Validar allowlist de estados para sesión de pago (fail closed)
    if (reservation.paymentStatus === ReservationPaymentStatus.PAID) {
      return null;
    }
    if (reservation.paymentStatus === ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW) {
      return null;
    }
    if (reservation.paymentStatus === ReservationPaymentStatus.PARTIALLY_PAID) {
      throw new ConflictException('La reserva se encuentra en pago parcial y requiere revisión administrativa');
    }
    if (
      reservation.paymentStatus === ReservationPaymentStatus.REFUND_PENDING ||
      reservation.paymentStatus === ReservationPaymentStatus.PARTIALLY_REFUNDED ||
      reservation.paymentStatus === ReservationPaymentStatus.REFUNDED
    ) {
      throw new ConflictException('La reserva se encuentra en proceso de reembolso o ha sido reembolsada');
    }
    if (
      reservation.paymentStatus === ReservationPaymentStatus.FAILED ||
      reservation.paymentStatus === ReservationPaymentStatus.EXPIRED
    ) {
      throw new ConflictException('La reserva ha expirado o fallado. Por favor inicie una nueva reserva.');
    }
    if (reservation.paymentStatus !== ReservationPaymentStatus.PENDING) {
      throw new BadRequestException('Estado de reserva no válido para iniciar sesión de pago');
    }

    if (amountMinor <= 0) {
      return null;
    }

    const FORM_TOKEN_TTL_MS = 14 * 60 * 1000; // 14 minutos (conservador frente a los 15m oficiales de Izipay)

    // 2. Comprobar si existe un formToken activo y no expirado
    const isTokenUsable = (token: string | null | undefined, createdAt: Date | null | undefined, status: string | null | undefined) => {
      if (!token) return false;
      if (status && status !== 'READY') return false;
      if (!createdAt) return false;
      const age = Date.now() - new Date(createdAt).getTime();
      return age >= 0 && age < FORM_TOKEN_TTL_MS;
    };

    if (isTokenUsable(reservation.paymentFormToken, reservation.paymentFormTokenCreatedAt, reservation.paymentSessionStatus)) {
      return reservation.paymentFormToken!;
    }

    // 3. Coordinación distribuida con lease en PostgreSQL (P1.3)
    // Coalesce local por proceso como optimización en memoria
    let inFlight = this.inFlightPaymentSessions.get(reservation.id);
    if (!inFlight) {
      inFlight = (async () => {
        const leaseOwner = crypto.randomUUID();
        const LEASE_DURATION_MS = 30000; // 30 segundos de lease para cubrir llamadas lentas/timeout
        const maxAttempts = 2;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const now = new Date();
          const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

          // Intentar adquirir el lease de generación en la base de datos
          const claim = await this.prisma.reservation.updateMany({
            where: {
              id: reservation.id,
              paymentStatus: ReservationPaymentStatus.PENDING,
              OR: [
                { paymentSessionExpiresAt: null },
                { paymentSessionExpiresAt: { lt: now } },
                { paymentSessionStatus: { in: ['IDLE', 'FAILED', 'EXPIRED'] } },
                { paymentSessionStatus: null },
              ],
            },
            data: {
              paymentSessionOwner: leaseOwner,
              paymentSessionExpiresAt: leaseExpiresAt,
              paymentSessionStatus: 'CREATING',
            },
          });

          if (claim.count === 1) {
            // Este proceso ganó el lease exclusivo: invocar a la pasarela
            try {
              const session = await this.paymentsService.createPaymentSession({
                orderId: reservation.code || `IB-${reservation.id.slice(0, 8)}`,
                amountMinor,
                currency: 'USD',
                customerEmail: reservation.customerEmail,
                customerFirstName: reservation.customerFirstName,
                customerLastName: reservation.customerLastName,
                customerPhone: reservation.customerPhone,
              });

              const tokenCreatedAt = new Date();
              // Persistir atómicamente el formToken solo si seguimos siendo los dueños del lease
              await this.prisma.reservation.updateMany({
                where: {
                  id: reservation.id,
                  paymentSessionOwner: leaseOwner,
                },
                data: {
                  paymentFormToken: session.formToken,
                  paymentFormTokenCreatedAt: tokenCreatedAt,
                  paymentSessionStatus: session.formToken ? 'READY' : 'FAILED',
                  paymentSessionExpiresAt: null,
                  paymentSessionOwner: null,
                },
              });

              return { formToken: session.formToken };
            } catch (providerError) {
              // Liberar el lease en caso de error para permitir reintentos posteriores
              await this.prisma.reservation.updateMany({
                where: {
                  id: reservation.id,
                  paymentSessionOwner: leaseOwner,
                },
                data: {
                  paymentSessionStatus: 'FAILED',
                  paymentSessionExpiresAt: null,
                  paymentSessionOwner: null,
                },
              }).catch(() => {});
              throw providerError;
            }
          }

          // Otro proceso/réplica posee el lease: esperar y consultar el resultado persistido
          for (let poll = 0; poll < 15; poll++) {
            await new Promise((r) => setTimeout(r, 200));
            const reloaded = await this.prisma.reservation.findUnique({
              where: { id: reservation.id },
              select: {
                paymentFormToken: true,
                paymentFormTokenCreatedAt: true,
                paymentSessionStatus: true,
                paymentSessionExpiresAt: true,
              },
            });

            if (reloaded && isTokenUsable(reloaded.paymentFormToken, reloaded.paymentFormTokenCreatedAt, reloaded.paymentSessionStatus)) {
              return { formToken: reloaded.paymentFormToken };
            }
            if (reloaded?.paymentSessionStatus === 'FAILED') {
              break; // El otro proceso falló; intentar adquirir el lease en la siguiente iteración
            }
            if (reloaded?.paymentSessionExpiresAt && reloaded.paymentSessionExpiresAt < new Date()) {
              break; // El lease del otro proceso expiró; intentar reclamarlo
            }
          }
        }

        // Si tras agotar esperas no hay sesión utilizable, consultar estado final en DB
        const finalCheck = await this.prisma.reservation.findUnique({
          where: { id: reservation.id },
          select: {
            paymentFormToken: true,
            paymentFormTokenCreatedAt: true,
            paymentSessionStatus: true,
          },
        });
        if (finalCheck && isTokenUsable(finalCheck.paymentFormToken, finalCheck.paymentFormTokenCreatedAt, finalCheck.paymentSessionStatus)) {
          return { formToken: finalCheck.paymentFormToken };
        }

        throw new ConflictException('No fue posible coordinar la sesión de pago concurrentemente. Por favor reintente.');
      })();

      this.inFlightPaymentSessions.set(reservation.id, inFlight);
    }

    try {
      const res = await inFlight;
      return res.formToken;
    } finally {
      this.inFlightPaymentSessions.delete(reservation.id);
    }
  }

  private async resolveAgency(tenantOrStorefront: TenantContext | string) {
    if (typeof tenantOrStorefront === 'object' && tenantOrStorefront !== null && 'agencyId' in tenantOrStorefront) {
      const agency = await this.prisma.agency.findFirst({
        where: { id: tenantOrStorefront.agencyId, isActive: true },
      });
      if (!agency) throw new NotFoundException('Agencia no disponible');
      return agency;
    }
    const storefront = String(tenantOrStorefront);
    if (!this.config.publicAgencySlugs.includes(storefront)) throw new NotFoundException('Agencia no autorizada');
    const agency = await this.prisma.agency.findFirst({
      where: { slug: storefront, isActive: true },
    });
    if (!agency) throw new NotFoundException('Agencia no encontrada');
    return agency;
  }

  async createCheckout(
    tenantOrStorefront: TenantContext | string,
    dto: CreateCheckoutDto,
    idempotencyKey?: string,
  ): Promise<CheckoutResponseDto> {
    const agency = await this.resolveAgency(tenantOrStorefront);

    // Normalización de entrada exhaustiva para huella criptográfica determinista (Tickets P1, P1.2)
    const canonicalPassengers = (dto.passengers || []).map((p) => ({
      firstName: p.firstName.trim().toLowerCase(),
      lastName: p.lastName.trim().toLowerCase(),
      documentType: p.documentType.trim().toLowerCase(),
      documentNumber: p.documentNumber.trim().toLowerCase(),
    })).sort((a, b) => {
      const keyA = `${a.documentType}:${a.documentNumber}:${a.lastName}:${a.firstName}`;
      const keyB = `${b.documentType}:${b.documentNumber}:${b.lastName}:${b.firstName}`;
      return keyA.localeCompare(keyB);
    });

    const canonicalItems = (dto.items || []).map((i) => ({
      slug: i.slug.trim().toLowerCase(),
      serviceType: i.serviceType.trim().toLowerCase(),
      date: i.date.trim(),
      pax: i.pax,
      vehicleCode: i.vehicleCode?.trim().toLowerCase() || null,
    })).sort((a, b) => {
      const keyA = `${a.slug}|${a.date}|${a.serviceType}|${a.pax}|${a.vehicleCode || ''}`;
      const keyB = `${b.slug}|${b.date}|${b.serviceType}|${b.pax}|${b.vehicleCode || ''}`;
      return keyA.localeCompare(keyB);
    });

    const normalizedPayload = {
      agencyId: agency.id,
      customerFirstName: dto.customerFirstName.trim().toLowerCase(),
      customerLastName: dto.customerLastName.trim().toLowerCase(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone.trim(),
      couponCode: dto.couponCode?.trim().toUpperCase() || null,
      pickupHotel: dto.pickupHotel?.trim().toLowerCase() || null,
      specialRequirements: dto.specialRequirements?.trim().toLowerCase() || null,
      items: canonicalItems,
      passengers: canonicalPassengers,
    };
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(normalizedPayload)).digest('hex');

    // 1. Manejo de idempotencia autoritativa mediante requestKey (Tickets A11, P1, P1.2)
    if (idempotencyKey) {
      const existing = await this.prisma.reservation.findFirst({
        where: {
          agencyId: agency.id,
          requestKey: idempotencyKey,
        },
        include: {
          items: {
            include: { tour: true, transfer: true },
          },
        },
      });

      if (existing) {
        if (existing.requestHash && existing.requestHash !== requestHash) {
          throw new ConflictException('Idempotency key ya utilizada con datos divergentes');
        }
        if (!existing.requestHash && existing.customerEmail.toLowerCase() !== dto.customerEmail.trim().toLowerCase()) {
          throw new ConflictException('Idempotency key ya utilizada con datos divergentes');
        }

        const totalMinor = (existing.totalMinor !== null && existing.totalMinor !== undefined && existing.totalMinor >= 0)
          ? existing.totalMinor
          : (existing.paidMinor > 0 ? existing.paidMinor : Math.round(existing.totalPrice * 100));
        const subtotalMinor = existing.originalPrice ? Math.round(existing.originalPrice * 100) : totalMinor;
        const discountMinor = existing.discountAmount ? Math.round(existing.discountAmount * 100) : 0;

        const formToken = await this.getOrCreatePaymentSession(existing, totalMinor);

        return {
          reservationId: existing.id,
          reservationCode: existing.code || `IB-${existing.id.slice(0, 8)}`,
          totalMinor,
          subtotalMinor,
          discountMinor,
          currency: 'USD',
          bookingStatus: existing.bookingStatus,
          paymentStatus: existing.paymentStatus,
          formToken,
          items: existing.items.map((it) => ({
            slug: it.tour?.slug || it.transfer?.slug || '',
            title: it.tour?.title || it.transfer?.title || 'Servicio',
            serviceType: it.serviceType,
            pax: it.pax,
            subtotalMinor: Math.round(it.totalPrice * 100),
          })),
        };
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El checkout debe contener al menos un ítem');
    }

    // 2. Cotización autoritativa y validación estricta de publicación y pertenencia (Tickets A10, A12, A13, P1)
    const calculatedItems: Array<{
      slug: string;
      title: string;
      serviceType: string;
      date: Date;
      pax: number;
      unitPriceMinor: number;
      subtotalMinor: number;
      tourId?: string;
      transferId?: string;
      vehicleTypeId?: string;
      vehicleName?: string;
    }> = [];

    let subtotalMinor = 0;

    for (const item of dto.items) {
      if (item.pax < 1 || item.pax > 100) {
        throw new BadRequestException(`Número de pasajeros inválido (${item.pax})`);
      }

      const itemDate = new Date(item.date);
      if (Number.isNaN(itemDate.getTime())) {
        throw new BadRequestException(`Fecha inválida para el ítem ${item.slug}`);
      }

      // Buscar tour de la agencia: OBLIGATORIO isPublished: true
      const tour = await this.prisma.tour.findFirst({
        where: {
          agencyId: agency.id,
          slug: item.slug,
          isPublished: true,
          agency: { isActive: true },
        },
        include: {
          privatePricing: { orderBy: { pax: 'asc' } },
        },
      });

      if (tour) {
        let itemSubtotalMinor = 0;
        let unitPriceMinor = 0;

        if (item.serviceType === 'shared') {
          if (!tour.hasSharedService || tour.sharedPrice === null) {
            throw new BadRequestException(`El tour "${tour.title}" no ofrece modalidad compartida`);
          }
          unitPriceMinor = Math.round(tour.sharedPrice * 100);
          itemSubtotalMinor = unitPriceMinor * item.pax;
        } else {
          if (!tour.hasPrivateService || !tour.privatePricing || tour.privatePricing.length === 0) {
            throw new BadRequestException(`El tour "${tour.title}" no ofrece modalidad privada`);
          }
          const tier = tour.privatePricing.find((p) => p.pax === item.pax) || tour.privatePricing[tour.privatePricing.length - 1];
          if (!tier) {
            throw new BadRequestException(`El tour "${tour.title}" no tiene tarifas privadas configuradas`);
          }
          unitPriceMinor = Math.round(tier.price * 100);
          itemSubtotalMinor = unitPriceMinor * item.pax;
        }

        subtotalMinor += itemSubtotalMinor;
        calculatedItems.push({
          slug: tour.slug,
          title: tour.title,
          serviceType: item.serviceType,
          date: itemDate,
          pax: item.pax,
          unitPriceMinor,
          subtotalMinor: itemSubtotalMinor,
          tourId: tour.id,
        });
        continue;
      }

      // Buscar traslado de la agencia: OBLIGATORIO isPublished: true y isActive: true
      const transfer = await this.prisma.transfer.findFirst({
        where: {
          agencyId: agency.id,
          slug: item.slug,
          isPublished: true,
          isActive: true,
          agency: { isActive: true },
        },
        include: {
          vehiclePrices: {
            include: { vehicle: true },
          },
        },
      });

      if (!transfer) {
        throw new NotFoundException(`Servicio "${item.slug}" no encontrado o no publicado en esta agencia`);
      }

      let transferSubtotalMinor = 0;
      let unitPriceMinor = 0;
      let selectedVehicleId: string | undefined;
      let selectedVehicleName: string | undefined;

      if (item.serviceType === 'shared') {
        if (!transfer.hasSharedService || transfer.sharedPrice === null) {
          throw new BadRequestException(`El traslado "${transfer.title}" no ofrece modalidad compartida`);
        }
        unitPriceMinor = Math.round(transfer.sharedPrice * 100);
        transferSubtotalMinor = unitPriceMinor * item.pax;
      } else {
        if (!transfer.hasPrivateService) {
          throw new BadRequestException(`El traslado "${transfer.title}" no ofrece modalidad privada`);
        }
        const vp = item.vehicleCode
          ? transfer.vehiclePrices.find((p) => p.vehicle.code === item.vehicleCode)
          : transfer.vehiclePrices.find((p) => p.vehicle.maxPax >= item.pax);

        if (!vp) {
          throw new BadRequestException(`No se encontró vehículo compatible para ${item.pax} pasajeros`);
        }
        // Validación estricta: vehículo DEBE pertenecer a esta misma agencia (falla si es null o de otra)
        if (!vp.vehicle || !vp.vehicle.agencyId || vp.vehicle.agencyId !== agency.id) {
          throw new BadRequestException('El vehículo no pertenece a esta agencia');
        }
        if (vp.vehicle.maxPax < item.pax) {
          throw new BadRequestException(`El vehículo "${vp.vehicle.name}" excede su capacidad máxima (${vp.vehicle.maxPax} pax)`);
        }

        unitPriceMinor = Math.round(vp.price * 100);
        transferSubtotalMinor = unitPriceMinor; // Tarifa fija de vehículo privado
        selectedVehicleId = vp.vehicle.id;
        selectedVehicleName = vp.vehicle.name;
      }

      subtotalMinor += transferSubtotalMinor;
      calculatedItems.push({
        slug: transfer.slug,
        title: transfer.title,
        serviceType: item.serviceType,
        date: itemDate,
        pax: item.pax,
        unitPriceMinor,
        subtotalMinor: transferSubtotalMinor,
        transferId: transfer.id,
        vehicleTypeId: selectedVehicleId,
        vehicleName: selectedVehicleName,
      });
    }

    // 3. Validación de cupones y límites de uso (Tickets A11, P1.2)
    let appliedCouponId: string | null = null;
    let discountMinor = 0;

    if (dto.couponCode) {
      const cleanCode = dto.couponCode.trim().toUpperCase();
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: cleanCode,
          isActive: true,
          OR: [{ agencyId: agency.id }, { agencyId: null }],
        },
      });

      const now = new Date();
      if (!coupon) {
        throw new BadRequestException('Cupón de descuento no válido');
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        throw new BadRequestException('El cupón ha expirado');
      }
      // Semántica estricta P1.2: null/undefined = ilimitado, > 0 = limitado, <= 0 = inválido/agotado
      if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
        if (coupon.usageLimit <= 0 || coupon.timesUsed >= coupon.usageLimit) {
          throw new BadRequestException('El cupón ha alcanzado su límite de usos');
        }
      }
      if (coupon.minSpend && (subtotalMinor / 100) < coupon.minSpend) {
        throw new BadRequestException('El monto de la reserva no alcanza el mínimo requerido para este cupón');
      }

      appliedCouponId = coupon.id;
      if (coupon.discountType === 'PERCENTAGE') {
        let disc = Math.round((subtotalMinor * coupon.discountValue) / 100);
        if (coupon.maxDiscount) {
          disc = Math.min(disc, Math.round(coupon.maxDiscount * 100));
        }
        discountMinor = disc;
      } else {
        discountMinor = Math.round(coupon.discountValue * 100);
      }
      discountMinor = Math.min(discountMinor, subtotalMinor);
    }

    const totalMinor = Math.max(0, subtotalMinor - discountMinor);
    const isZeroTotal = totalMinor === 0;

    const reservationCode = idempotencyKey
      ? `IB-${crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 12).toUpperCase()}`
      : `IB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const firstItem = calculatedItems[0];
    if (!firstItem) {
      throw new BadRequestException('No se procesaron ítems para la reserva');
    }

    // 4. Inserción atómica con protección ante carreras concurrentes (Tickets A11, P1, P1.2, P1.3)
    let reservation: any;
    try {
      if (isZeroTotal) {
        // Flujo atómico transaccional para reservas bonificadas al 100% (P1.3)
        reservation = await this.prisma.$transaction(async (tx) => {
          let appliedCouponCode = 'N/A';
          if (appliedCouponId) {
            const coupon = await tx.coupon.findUnique({ where: { id: appliedCouponId } });
            if (!coupon) {
              throw new BadRequestException('Cupón de descuento no válido');
            }
            appliedCouponCode = coupon.code;
            if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
              if (coupon.usageLimit <= 0) {
                throw new ConflictException('El cupón ha alcanzado su límite de usos');
              }
              const claim = await tx.coupon.updateMany({
                where: {
                  id: appliedCouponId,
                  timesUsed: { lt: coupon.usageLimit },
                },
                data: {
                  timesUsed: { increment: 1 },
                },
              });
              if (claim.count === 0) {
                throw new ConflictException('El cupón ha alcanzado su límite de usos');
              }
            } else {
              await tx.coupon.update({
                where: { id: appliedCouponId },
                data: { timesUsed: { increment: 1 } },
              });
            }
          }

          const created = await tx.reservation.create({
            data: {
              agencyId: agency.id,
              code: reservationCode,
              requestKey: idempotencyKey || null,
              requestHash: requestHash,
              bookingStatus: BookingStatus.CONFIRMED,
              paymentStatus: ReservationPaymentStatus.PAID,
              status: ReservationStatus.PAID,
              paidMinor: 0,
              totalMinor: 0,
              unitPriceMinor: firstItem.unitPriceMinor,
              serviceTitle: firstItem.title,
              vehicleName: firstItem.vehicleName || null,
              totalPrice: 0,
              originalPrice: subtotalMinor / 100,
              discountAmount: discountMinor / 100,
              currency: 'USD',
              couponId: appliedCouponId,
              customerFirstName: dto.customerFirstName.trim(),
              customerLastName: dto.customerLastName.trim(),
              customerEmail: dto.customerEmail.trim().toLowerCase(),
              customerPhone: dto.customerPhone.trim(),
              pickupHotel: dto.pickupHotel?.trim() || null,
              specialRequirements: dto.specialRequirements?.trim() || null,
              date: firstItem.date,
              pax: firstItem.pax,
              serviceType: firstItem.serviceType,
              paymentReference: null, // P1.3: paymentReference se reserva exclusivamente para IDs de pasarela
              items: {
                create: calculatedItems.map((it) => ({
                  serviceType: it.serviceType,
                  date: it.date,
                  pax: it.pax,
                  unitPrice: it.unitPriceMinor / 100,
                  totalPrice: it.subtotalMinor / 100,
                  tourId: it.tourId,
                  transferId: it.transferId,
                  vehicleTypeId: it.vehicleTypeId,
                })),
              },
              passengers: {
                create: (dto.passengers || []).map((p) => ({
                  firstName: p.firstName.trim(),
                  lastName: p.lastName.trim(),
                  docType: p.documentType.trim(),
                  docNumber: p.documentNumber.trim(),
                })),
              },
            },
          });

          await tx.paymentNotification.create({
            data: {
              legacyId: created.id,
              audience: 'CUSTOMER',
              kind: 'ORDER_CONFIRMED',
              state: 'PENDING',
              snapshot: {
                email: created.customerEmail,
                name: `${created.customerFirstName} ${created.customerLastName}`,
                reservationCode: created.code,
                paidMinor: 0,
                currency: created.currency,
                transactionUuid: null,
              },
            },
          });

          await tx.reservationEvent.create({
            data: {
              reservationId: created.id,
              actorId: 'system',
              actorLabel: 'system:checkout-zero-total',
              toStatus: OperationalStatus.CONFIRMED,
              note: `[AUDIT: ZERO_TOTAL_CHECKOUT_CONFIRMED] Reserva confirmada con importe 0 mediante bonificación de cupón "${appliedCouponCode}"`,
            },
          });

          return created;
        });
      } else {
        reservation = await this.prisma.reservation.create({
          data: {
            agencyId: agency.id,
            code: reservationCode,
            requestKey: idempotencyKey || null,
            requestHash: requestHash,
            bookingStatus: BookingStatus.PENDING,
            paymentStatus: ReservationPaymentStatus.PENDING,
            status: ReservationStatus.PENDING,
            paidMinor: 0,
            totalMinor: totalMinor,
            unitPriceMinor: firstItem.unitPriceMinor,
            serviceTitle: firstItem.title,
            vehicleName: firstItem.vehicleName || null,
            totalPrice: totalMinor / 100,
            originalPrice: subtotalMinor / 100,
            discountAmount: discountMinor / 100,
            currency: 'USD',
            couponId: appliedCouponId,
            customerFirstName: dto.customerFirstName.trim(),
            customerLastName: dto.customerLastName.trim(),
            customerEmail: dto.customerEmail.trim().toLowerCase(),
            customerPhone: dto.customerPhone.trim(),
            pickupHotel: dto.pickupHotel?.trim() || null,
            specialRequirements: dto.specialRequirements?.trim() || null,
            date: firstItem.date,
            pax: firstItem.pax,
            serviceType: firstItem.serviceType,
            paymentReference: null,
            items: {
              create: calculatedItems.map((it) => ({
                serviceType: it.serviceType,
                date: it.date,
                pax: it.pax,
                unitPrice: it.unitPriceMinor / 100,
                totalPrice: it.subtotalMinor / 100,
                tourId: it.tourId,
                transferId: it.transferId,
                vehicleTypeId: it.vehicleTypeId,
              })),
            },
            passengers: {
              create: (dto.passengers || []).map((p) => ({
                firstName: p.firstName.trim(),
                lastName: p.lastName.trim(),
                docType: p.documentType.trim(),
                docNumber: p.documentNumber.trim(),
              })),
            },
          },
        });
      }
    } catch (createErr: any) {
      // Manejo de carrera concurrente con misma clave
      if (idempotencyKey && (createErr?.code === 'P2002' || String(createErr?.message).includes('unique constraint') || String(createErr?.message).includes('requestKey'))) {
        const winningRes = await this.prisma.reservation.findFirst({
          where: { agencyId: agency.id, requestKey: idempotencyKey },
          include: { items: { include: { tour: true, transfer: true } } },
        });
        if (winningRes) {
          if (winningRes.requestHash && winningRes.requestHash !== requestHash) {
            throw new ConflictException('Idempotency key ya utilizada con datos divergentes');
          }
          const formToken = await this.getOrCreatePaymentSession(winningRes, totalMinor);
          return {
            reservationId: winningRes.id,
            reservationCode: winningRes.code || reservationCode,
            totalMinor,
            subtotalMinor,
            discountMinor,
            currency: 'USD',
            bookingStatus: winningRes.bookingStatus,
            paymentStatus: winningRes.paymentStatus,
            formToken,
            items: calculatedItems.map((it) => ({
              slug: it.slug,
              title: it.title,
              serviceType: it.serviceType,
              pax: it.pax,
              subtotalMinor: it.subtotalMinor,
            })),
          };
        }
      }
      throw createErr;
    }

    // 5. Creación controlada de sesión de pago Izipay (Tickets P1, P1.2)
    let formToken: string | null = null;
    if (totalMinor > 0) {
      formToken = await this.getOrCreatePaymentSession(reservation, totalMinor);
    }

    return {
      reservationId: reservation.id,
      reservationCode: reservation.code || reservationCode,
      totalMinor,
      subtotalMinor,
      discountMinor,
      currency: 'USD',
      bookingStatus: reservation.bookingStatus,
      paymentStatus: reservation.paymentStatus,
      formToken,
      items: calculatedItems.map((it) => ({
        slug: it.slug,
        title: it.title,
        serviceType: it.serviceType,
        pax: it.pax,
        subtotalMinor: it.subtotalMinor,
      })),
    };
  }
}
