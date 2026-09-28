import crypto from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ReservationPaymentStatus,
  ReservationStatus,
} from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  IpnProcessResultDto,
  IzipayIpnAnswerDto,
  IzipayIpnPayloadDto,
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
    const secret = this.config.izipaySecretKey;
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

    // 1. Verificación criptográfica obligatoria de firma HMAC (Tickets A10, A14)
    const isValid = this.verifySignature(rawAnswer, hash);
    if (!isValid) {
      throw new BadRequestException('Firma HMAC del webhook inválida');
    }

    const answer: IzipayIpnAnswerDto = typeof rawAnswer === 'string' ? JSON.parse(rawAnswer) : rawAnswer;
    const orderDetails = answer.orderDetails;
    if (!orderDetails || !orderDetails.orderId) {
      throw new BadRequestException('Formato de IPN no contiene orderDetails.orderId');
    }

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

    // Si ya fue confirmada anteriormente, responder con idempotencia
    if (reservation.paymentStatus === ReservationPaymentStatus.PAID) {
      return {
        success: true,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'PAID',
        paidMinor: reservation.paidMinor,
      };
    }

    const isSuccess = answer.orderStatus === 'PAID' || answer.orderStatus === 'SUCCESS';
    if (!isSuccess) {
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: answer.orderStatus,
        reviewReason: 'PAYMENT_NOT_CONFIRMED_BY_GATEWAY',
      };
    }

    // 2. Cotejo estricto de importe y moneda (Tickets A10, A14)
    const expectedMinor = (reservation.totalMinor !== null && reservation.totalMinor !== undefined && reservation.totalMinor > 0)
      ? reservation.totalMinor
      : Math.round(reservation.totalPrice * 100);
    const receivedMinor = orderDetails.orderTotalAmount;
    const receivedCurrency = (orderDetails.orderCurrency || 'USD').toUpperCase();
    const expectedCurrency = (reservation.currency || 'USD').toUpperCase();

    if (receivedCurrency !== expectedCurrency) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
          specialRequirements: `[AUDIT: CURRENCY_MISMATCH] Esperado ${expectedCurrency}, recibido ${receivedCurrency}`,
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
        data: {
          paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
          specialRequirements: `[AUDIT: AMOUNT_MISMATCH] Esperado ${expectedMinor}c, recibido ${receivedMinor}c`,
        },
      });
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'AMOUNT_MISMATCH',
      };
    }

    const transactionUuid = answer.transactions?.[0]?.uuid || null;

    // 3. Transición atómica SQL con Outbox transaccional (Tickets A10, A11, A15, A16)
    await this.prisma.$transaction(async (tx) => {
      // A. Actualizar estado de la reserva
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: ReservationPaymentStatus.PAID,
          paidMinor: receivedMinor,
          paymentReference: transactionUuid || reservation.paymentReference,
        },
      });

      // B. Confirmar consumo de cupón si aplica
      if (reservation.couponId) {
        await tx.coupon.update({
          where: { id: reservation.couponId },
          data: { timesUsed: { increment: 1 } },
        });
      }

      // C. Inserción en Outbox de notificaciones
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
          },
        },
      });
    });

    return {
      success: true,
      reservationCode: reservation.code || orderDetails.orderId,
      status: 'PAID',
      paidMinor: receivedMinor,
    };
  }
}
