import crypto from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  OperationalStatus,
  ReservationPaymentStatus,
  ReservationStatus,
} from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  IpnProcessResultDto,
  IzipayIpnAnswerDto,
  IzipayIpnPayloadDto,
  ipnAnswerSchema,
} from './payments.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  verifySignature(rawPayload: unknown, receivedHash: string | undefined): boolean {
    if (!receivedHash) return false;
    const payloadStr = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
    // Credencial oficial de Izipay para IPN server-to-server: PASSWORD (o izipayPassword)
    const secret = this.config.izipayPassword || this.config.izipaySecretKey;
    if (!secret) return false;

    try {
      const calculatedHash = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
      const calcBuf = Buffer.from(calculatedHash, 'hex');
      const recvBuf = Buffer.from(receivedHash, 'hex');
      if (calcBuf.length !== recvBuf.length) return false;
      return crypto.timingSafeEqual(calcBuf, recvBuf);
    } catch {
      return false;
    }
  }

  async createPaymentSession(params: {
    orderId: string;
    amountMinor: number;
    currency?: string;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
  }): Promise<{ formToken: string | null }> {
    if (this.config.environment === 'test') {
      return { formToken: `test_token_${params.orderId}` };
    }

    const { izipayShopId, izipayPassword, izipayApiUrl, izipayCurrency } = this.config;
    if (!izipayShopId || !izipayPassword) {
      if (this.config.environment === 'production') {
        throw new BadRequestException('Pasarela de pago no configurada en el servidor');
      }
      return { formToken: null };
    }

    const authHeader = `Basic ${Buffer.from(`${izipayShopId}:${izipayPassword}`).toString('base64')}`;
    const currency = (params.currency || izipayCurrency || 'USD').toUpperCase();

    try {
      const response = await fetch(`${izipayApiUrl}/api-payment/V4/Charge/CreatePayment`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: params.amountMinor,
          currency,
          orderId: params.orderId,
          customer: {
            email: params.customerEmail,
            billingDetails: {
              firstName: params.customerFirstName,
              lastName: params.customerLastName,
              phoneNumber: params.customerPhone,
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();
      if (data.status !== 'SUCCESS' || !data.answer?.formToken) {
        const errorMsg = data._error?.message || 'No se pudo iniciar la transacción con la pasarela de pago';
        throw new BadRequestException(errorMsg);
      }

      return { formToken: data.answer.formToken };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error de comunicación con la pasarela de pago');
    }
  }

  async processIzipayIpn(payload: IzipayIpnPayloadDto, headerHash?: string): Promise<IpnProcessResultDto> {
    const rawAnswer = payload['kr-answer'];
    const hash = headerHash || payload['kr-hash'];

    // 1. Verificación criptográfica obligatoria de firma HMAC sobre el string exacto (Tickets A10, A14, P1)
    const isValid = this.verifySignature(rawAnswer, hash);
    if (!isValid) {
      throw new BadRequestException('Firma HMAC del webhook inválida');
    }

    // 2. Parseo y validación de estructura solo posterior a firma válida (Ticket P1)
    let answerObj: any;
    try {
      answerObj = typeof rawAnswer === 'string' ? JSON.parse(rawAnswer) : rawAnswer;
    } catch {
      throw new BadRequestException('Payload kr-answer contiene JSON malformado');
    }

    const parsedAnswer = ipnAnswerSchema.safeParse(answerObj);
    if (!parsedAnswer.success) {
      const issues = parsedAnswer.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new BadRequestException(`Estructura de IPN inválida: ${issues}`);
    }

    const answer = parsedAnswer.data;
    const orderDetails = answer.orderDetails;

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        OR: [
          { code: orderDetails.orderId },
          { id: orderDetails.orderId },
        ],
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva "${orderDetails.orderId}" no encontrada`);
    }

    // Si ya fue confirmada anteriormente, responder con idempotencia sin efectos colaterales
    if (reservation.paymentStatus === ReservationPaymentStatus.PAID) {
      return {
        success: true,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'PAID',
        paidMinor: reservation.paidMinor,
      };
    }

    // 3. Validación de estado documentado por Izipay: Solo 'PAID' es aceptado (Ticket P1)
    if (answer.orderStatus !== 'PAID') {
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: answer.orderStatus,
        reviewReason: 'PAYMENT_NOT_CONFIRMED_BY_GATEWAY',
      };
    }

    // 4. Validación de identificador de transacción/reconciliación (Ticket P1)
    const transactionUuid = answer.transactions?.[0]?.uuid;
    if (!transactionUuid) {
      await this.prisma.reservationEvent.create({
        data: {
          reservationId: reservation.id,
          actorId: 'system',
          actorLabel: 'system:izipay-ipn',
          toStatus: reservation.operationStatus || OperationalStatus.PENDING,
          note: '[AUDIT: MISSING_TRANSACTION_UUID] Notificación PAID recibida sin UUID de transacción',
        },
      });
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'MISSING_TRANSACTION_UUID',
      };
    }

    // 5. Cotejo estricto de importe y moneda sin sobreescribir notas del cliente (Tickets A10, A14, P1)
    const expectedMinor = (reservation.totalMinor !== null && reservation.totalMinor !== undefined && reservation.totalMinor > 0)
      ? reservation.totalMinor
      : Math.round(reservation.totalPrice * 100);
    const receivedMinor = orderDetails.orderTotalAmount;
    const receivedCurrency = orderDetails.orderCurrency.toUpperCase();
    const expectedCurrency = (reservation.currency || 'USD').toUpperCase();

    if (receivedCurrency !== expectedCurrency) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW },
      });
      await this.prisma.reservationEvent.create({
        data: {
          reservationId: reservation.id,
          actorId: 'system',
          actorLabel: 'system:izipay-ipn',
          toStatus: reservation.operationStatus || OperationalStatus.PENDING,
          note: `[AUDIT: CURRENCY_MISMATCH] Esperado ${expectedCurrency}, recibido ${receivedCurrency}`,
        },
      });
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'CURRENCY_MISMATCH',
      };
    }

    if (receivedMinor !== expectedMinor) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW },
      });
      await this.prisma.reservationEvent.create({
        data: {
          reservationId: reservation.id,
          actorId: 'system',
          actorLabel: 'system:izipay-ipn',
          toStatus: reservation.operationStatus || OperationalStatus.PENDING,
          note: `[AUDIT: AMOUNT_MISMATCH] Esperado ${expectedMinor}c, recibido ${receivedMinor}c`,
        },
      });
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'AMOUNT_MISMATCH',
      };
    }

    // 6. Transición atómica concurrente y consumo condicional de cupón (Tickets A10, A11, A15, A16, P1)
    let couponCapacityExhausted = false;

    await this.prisma.$transaction(async (tx) => {
      // A. Transición atómica PENDING -> PAID (gana exactamente una transacción)
      const updateResult = await tx.reservation.updateMany({
        where: {
          id: reservation.id,
          paymentStatus: {
            in: [ReservationPaymentStatus.PENDING, ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW],
          },
        },
        data: {
          status: ReservationStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: ReservationPaymentStatus.PAID,
          paidMinor: receivedMinor,
          paymentReference: transactionUuid,
        },
      });

      if (updateResult.count === 0) {
        // Carrera concurrente: otra petición completó la transición a PAID
        return;
      }

      // B. Consumo atómico condicional de cupón con límite (Ticket P1)
      if (reservation.couponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: reservation.couponId } });
        if (coupon && coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
          const claim = await tx.coupon.updateMany({
            where: {
              id: reservation.couponId,
              timesUsed: { lt: coupon.usageLimit },
            },
            data: {
              timesUsed: { increment: 1 },
            },
          });

          if (claim.count === 0) {
            // Capacidad de cupón agotada concurrentemente por otra reserva
            couponCapacityExhausted = true;
            await tx.reservation.update({
              where: { id: reservation.id },
              data: {
                paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
              },
            });
            await tx.reservationEvent.create({
              data: {
                reservationId: reservation.id,
                actorId: 'system',
                actorLabel: 'system:izipay-ipn',
                toStatus: reservation.operationStatus || OperationalStatus.PENDING,
                note: `[AUDIT: COUPON_OVERALLOCATED_REVIEW] Cupón "${coupon.code}" agotó su cupo (${coupon.usageLimit}) concurrentemente tras captura de pago.`,
              },
            });
            return;
          }
        } else if (reservation.couponId) {
          await tx.coupon.update({
            where: { id: reservation.couponId },
            data: { timesUsed: { increment: 1 } },
          });
        }
      }

      // C. Inserción única en Outbox transaccional de notificaciones
      await tx.paymentNotification.create({
        data: {
          legacyId: reservation.id,
          audience: 'CUSTOMER',
          kind: 'ORDER_CONFIRMED',
          state: 'PENDING',
          snapshot: {
            email: reservation.customerEmail,
            name: `${reservation.customerFirstName} ${reservation.customerLastName}`,
            reservationCode: reservation.code,
            paidMinor: receivedMinor,
            currency: reservation.currency,
            transactionUuid,
          },
        },
      });
    });

    if (couponCapacityExhausted) {
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'COUPON_CAPACITY_EXHAUSTED',
      };
    }

    return {
      success: true,
      reservationCode: reservation.code || orderDetails.orderId,
      status: 'PAID',
      paidMinor: receivedMinor,
    };
  }
}
