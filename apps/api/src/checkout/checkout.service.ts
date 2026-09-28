import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, ReservationPaymentStatus, ReservationStatus } from '@repo/db/prisma';
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
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    private readonly paymentsService: PaymentsService,
  ) {}

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

    // Normalización de entrada para huella criptográfica determinista (Ticket P1)
    const normalizedPayload = {
      agencyId: agency.id,
      customerFirstName: dto.customerFirstName.trim().toLowerCase(),
      customerLastName: dto.customerLastName.trim().toLowerCase(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone.trim(),
      couponCode: dto.couponCode?.trim().toUpperCase() || null,
      pickupHotel: dto.pickupHotel?.trim() || null,
      specialRequirements: dto.specialRequirements?.trim() || null,
      items: (dto.items || []).map((i) => ({
        slug: i.slug.trim().toLowerCase(),
        serviceType: i.serviceType,
        date: i.date.trim(),
        pax: i.pax,
        vehicleCode: i.vehicleCode?.trim() || null,
      })).sort((a, b) => a.slug.localeCompare(b.slug)),
    };
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(normalizedPayload)).digest('hex');

    // 1. Manejo de idempotencia autoritativa mediante requestKey (Tickets A11, P1)
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

        const totalMinor = (existing.totalMinor !== null && existing.totalMinor !== undefined && existing.totalMinor > 0)
          ? existing.totalMinor
          : (existing.paidMinor > 0 ? existing.paidMinor : Math.round(existing.totalPrice * 100));
        const subtotalMinor = existing.originalPrice ? Math.round(existing.originalPrice * 100) : totalMinor;
        const discountMinor = existing.discountAmount ? Math.round(existing.discountAmount * 100) : 0;

        let formToken: string | null = null;
        // Si ya está PAID, retornar estado sin solicitar nueva sesión ni devolver UUID como token
        if (existing.paymentStatus === ReservationPaymentStatus.PAID) {
          formToken = null;
        } else if (totalMinor > 0) {
          // Recuperación resiliente de sesión de pago si quedó pendiente
          try {
            const session = await this.paymentsService.createPaymentSession({
              orderId: existing.code || `IB-${existing.id.slice(0, 8)}`,
              amountMinor: totalMinor,
              currency: 'USD',
              customerEmail: existing.customerEmail,
              customerFirstName: existing.customerFirstName,
              customerLastName: existing.customerLastName,
              customerPhone: existing.customerPhone,
            });
            formToken = session.formToken;
          } catch {
            formToken = null;
          }
        }

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

    // 3. Validación de cupones sin quemado prematuro (Ticket A11)
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
      if (
        coupon &&
        (!coupon.expiresAt || new Date(coupon.expiresAt) >= now) &&
        (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit) &&
        (!coupon.minSpend || (subtotalMinor / 100) >= coupon.minSpend)
      ) {
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
      } else {
        throw new BadRequestException('Cupón de descuento no válido o condiciones no alcanzadas');
      }
    }

    const totalMinor = Math.max(0, subtotalMinor - discountMinor);
    const reservationCode = idempotencyKey
      ? `IB-${idempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()}`
      : `IB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const firstItem = calculatedItems[0];
    if (!firstItem) {
      throw new BadRequestException('No se procesaron ítems para la reserva');
    }

    // 4. Inserción atómica con protección ante carreras concurrentes (Tickets A11, P1)
    let reservation: any;
    try {
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
          paymentReference: null, // requestKey NO se mezcla con paymentReference
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
          let formToken: string | null = null;
          if (winningRes.paymentStatus !== ReservationPaymentStatus.PAID && totalMinor > 0) {
            try {
              const session = await this.paymentsService.createPaymentSession({
                orderId: winningRes.code || `IB-${winningRes.id.slice(0, 8)}`,
                amountMinor: totalMinor,
                currency: 'USD',
                customerEmail: winningRes.customerEmail,
                customerFirstName: winningRes.customerFirstName,
                customerLastName: winningRes.customerLastName,
                customerPhone: winningRes.customerPhone,
              });
              formToken = session.formToken;
            } catch {
              formToken = null;
            }
          }
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

    // 5. Creación de sesión Izipay resiliente (Ticket P1)
    let formToken: string | null = null;
    if (totalMinor > 0) {
      try {
        const session = await this.paymentsService.createPaymentSession({
          orderId: reservation.code || reservationCode,
          amountMinor: totalMinor,
          currency: 'USD',
          customerEmail: reservation.customerEmail,
          customerFirstName: reservation.customerFirstName,
          customerLastName: reservation.customerLastName,
          customerPhone: reservation.customerPhone,
        });
        formToken = session.formToken;
      } catch (err: any) {
        // La reserva persiste; ante reintento con la misma clave se recupera la sesión
        formToken = null;
      }
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
