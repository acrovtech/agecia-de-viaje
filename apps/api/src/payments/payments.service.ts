import crypto from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
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
    // Credencial oficial de Izipay para IPN server-to-server: IZIPAY_PASSWORD
    const secret = this.config.izipayPassword || (this.config.environment !== 'production' ? this.config.izipaySecretKey : '');
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
    if (!izipayShopId || !izipayPassword || !izipayApiUrl) {
      if (this.config.environment === 'production' || this.config.checkoutEnabled) {
        throw new BadGatewayException({
          statusCode: 502,
          error: 'Bad Gateway',
          message: 'Pasarela de pago no configurada en el servidor',
          diagnosticCode: 'GATEWAY_CONFIG_ERROR',
        });
      }
      return { formToken: null };
    }

    const authHeader = `Basic ${Buffer.from(`${izipayShopId}:${izipayPassword}`).toString('base64')}`;
    const currency = (params.currency || izipayCurrency || 'USD').toUpperCase();

    let response: Response;
    try {
      response = await fetch(`${izipayApiUrl}/api-payment/V4/Charge/CreatePayment`, {
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
    } catch (fetchErr: any) {
      if (fetchErr.name === 'TimeoutError' || String(fetchErr?.message).includes('timeout')) {
        throw new GatewayTimeoutException({
          statusCode: 504,
          error: 'Gateway Timeout',
          message: 'Tiempo de espera agotado al conectar con la pasarela de pago',
          diagnosticCode: 'GATEWAY_TIMEOUT',
        });
      }
      throw new BadGatewayException({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Fallo de conectividad con la pasarela de pago',
        diagnosticCode: 'GATEWAY_SERVER_ERROR',
      });
    }

    if (response.status >= 400 && response.status < 500) {
      throw new BadGatewayException({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Error de cliente devuelto por la pasarela de pago',
        diagnosticCode: 'GATEWAY_CLIENT_ERROR',
      });
    }

    if (response.status >= 500) {
      throw new BadGatewayException({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Error interno devuelto por la pasarela de pago',
        diagnosticCode: 'GATEWAY_SERVER_ERROR',
      });
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new BadGatewayException({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Respuesta malformada de la pasarela de pago',
        diagnosticCode: 'GATEWAY_MALFORMED_RESPONSE',
      });
    }

    if (data.status !== 'SUCCESS' || !data.answer?.formToken) {
      throw new BadGatewayException({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'La pasarela de pago no devolvió un token de formulario válido',
        diagnosticCode: 'GATEWAY_MALFORMED_RESPONSE',
      });
    }

    return { formToken: data.answer.formToken };
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

    // 2. REVIEW es un estado terminal para el procesamiento automático de IPN (Ticket P1.2)
    // No se reabre automáticamente a PAID sin una conciliación administrativa autenticada
    if (reservation.paymentStatus === ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW) {
      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'RESERVATION_UNDER_FINANCIAL_REVIEW',
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

    // 4. Validación de identificador de transacción/reconciliación (Tickets P1, P1.4)
    // Política de Semántica de Primera Transición Autoritativa:
    // Una notificación PAID válida sin UUID de transacción no puede quedar PENDING ni pasar a PAID;
    // debe transicionar atómicamente a PAYMENT_RECEIVED_REVIEW y crear su evento de auditoría en la misma transacción.
    const transactionUuid = answer.transactions?.[0]?.uuid;
    if (!transactionUuid) {
      const missingUuidTx = await this.prisma.$transaction(async (tx) => {
        const update = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            paymentStatus: ReservationPaymentStatus.PENDING,
          },
          data: {
            status: ReservationStatus.PENDING,
            bookingStatus: BookingStatus.PENDING,
            paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
            paidMinor: orderDetails.orderTotalAmount,
            paymentFormToken: null,
            paymentSessionStatus: 'REVIEW',
            paymentSessionOwner: null,
            paymentSessionExpiresAt: null,
          },
        });

        if (update.count === 0) {
          return { transitionLost: true as const };
        }

        await tx.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            actorId: 'system',
            actorLabel: 'system:izipay-ipn',
            toStatus: reservation.operationStatus || OperationalStatus.PENDING,
            note: '[AUDIT: MISSING_TRANSACTION_UUID] Notificación PAID válida recibida sin UUID de transacción; puesta en revisión financiera',
          },
        });

        return { transitionLost: false as const };
      });

      if (missingUuidTx.transitionLost) {
        const reloaded = await this.prisma.reservation.findUnique({ where: { id: reservation.id } });
        if (reloaded?.paymentStatus === ReservationPaymentStatus.PAID) {
          return {
            success: true,
            reservationCode: reloaded.code || orderDetails.orderId,
            status: 'PAID',
            paidMinor: reloaded.paidMinor,
          };
        }
        return {
          success: false,
          reservationCode: reloaded?.code || orderDetails.orderId,
          status: 'REVIEW_REQUIRED',
          reviewReason: 'RESERVATION_UNDER_FINANCIAL_REVIEW',
        };
      }

      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'MISSING_TRANSACTION_UUID',
      };
    }

    // 5. Cotejo estricto de importe y moneda sin sobreescribir notas del cliente (Tickets A10, A14, P1, P1.2, P1.3, P1.4)
    // Semántica de Primera Transición Autoritativa:
    // - Si una notificación de discrepancia (monto/moneda) gana la primera transición condicional (desde PENDING),
    //   la reserva queda en cuarentena REVIEW y una posterior notificación no puede levantarla automáticamente.
    // - Si una notificación PAID exacta ya confirmó la reserva, una discrepancia tardía pierde la condición y no degrada PAID.
    const expectedMinor = (reservation.totalMinor !== null && reservation.totalMinor !== undefined && reservation.totalMinor > 0)
      ? reservation.totalMinor
      : Math.round(reservation.totalPrice * 100);
    const receivedMinor = orderDetails.orderTotalAmount;
    const receivedCurrency = orderDetails.orderCurrency.toUpperCase();
    const expectedCurrency = (reservation.currency || 'USD').toUpperCase();

    if (receivedCurrency !== expectedCurrency) {
      const currencyMismatchTx = await this.prisma.$transaction(async (tx) => {
        const mismatch = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            paymentStatus: ReservationPaymentStatus.PENDING,
          },
          data: {
            status: ReservationStatus.PENDING,
            bookingStatus: BookingStatus.PENDING,
            paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
            paidMinor: receivedMinor,
            paymentReference: transactionUuid,
            paymentFormToken: null,
            paymentSessionStatus: 'REVIEW',
            paymentSessionOwner: null,
            paymentSessionExpiresAt: null,
          },
        });

        if (mismatch.count === 0) {
          return { transitionLost: true as const };
        }

        await tx.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            actorId: 'system',
            actorLabel: 'system:izipay-ipn',
            toStatus: reservation.operationStatus || OperationalStatus.PENDING,
            note: `[AUDIT: CURRENCY_MISMATCH] Esperado ${expectedCurrency}, recibido ${receivedCurrency}. Transacción: ${transactionUuid}`,
          },
        });

        return { transitionLost: false as const };
      });

      if (currencyMismatchTx.transitionLost) {
        const reloaded = await this.prisma.reservation.findUnique({ where: { id: reservation.id } });
        if (reloaded?.paymentStatus === ReservationPaymentStatus.PAID) {
          return {
            success: true,
            reservationCode: reloaded.code || orderDetails.orderId,
            status: 'PAID',
            paidMinor: reloaded.paidMinor,
          };
        }
        return {
          success: false,
          reservationCode: reloaded?.code || orderDetails.orderId,
          status: 'REVIEW_REQUIRED',
          reviewReason: 'RESERVATION_UNDER_FINANCIAL_REVIEW',
        };
      }

      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'CURRENCY_MISMATCH',
      };
    }

    if (receivedMinor !== expectedMinor) {
      const amountMismatchTx = await this.prisma.$transaction(async (tx) => {
        const mismatch = await tx.reservation.updateMany({
          where: {
            id: reservation.id,
            paymentStatus: ReservationPaymentStatus.PENDING,
          },
          data: {
            status: ReservationStatus.PENDING,
            bookingStatus: BookingStatus.PENDING,
            paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
            paidMinor: receivedMinor,
            paymentReference: transactionUuid,
            paymentFormToken: null,
            paymentSessionStatus: 'REVIEW',
            paymentSessionOwner: null,
            paymentSessionExpiresAt: null,
          },
        });

        if (mismatch.count === 0) {
          return { transitionLost: true as const };
        }

        await tx.reservationEvent.create({
          data: {
            reservationId: reservation.id,
            actorId: 'system',
            actorLabel: 'system:izipay-ipn',
            toStatus: reservation.operationStatus || OperationalStatus.PENDING,
            note: `[AUDIT: AMOUNT_MISMATCH] Esperado ${expectedMinor}c, recibido ${receivedMinor}c. Transacción: ${transactionUuid}`,
          },
        });

        return { transitionLost: false as const };
      });

      if (amountMismatchTx.transitionLost) {
        const reloaded = await this.prisma.reservation.findUnique({ where: { id: reservation.id } });
        if (reloaded?.paymentStatus === ReservationPaymentStatus.PAID) {
          return {
            success: true,
            reservationCode: reloaded.code || orderDetails.orderId,
            status: 'PAID',
            paidMinor: reloaded.paidMinor,
          };
        }
        return {
          success: false,
          reservationCode: reloaded?.code || orderDetails.orderId,
          status: 'REVIEW_REQUIRED',
          reviewReason: 'RESERVATION_UNDER_FINANCIAL_REVIEW',
        };
      }

      return {
        success: false,
        reservationCode: reservation.code || orderDetails.orderId,
        status: 'REVIEW_REQUIRED',
        reviewReason: 'AMOUNT_MISMATCH',
      };
    }

    // 6. Transición atómica concurrente y consumo condicional de cupón (Tickets A10, A11, A15, A16, P1, P1.2, P1.3, P1.4)
    const txResult = await this.prisma.$transaction(async (tx) => {
      // A. Transición atómica PENDING -> PAID (sólo PENDING puede pasar a PAID automáticamente)
      const updateResult = await tx.reservation.updateMany({
        where: {
          id: reservation.id,
          paymentStatus: ReservationPaymentStatus.PENDING,
        },
        data: {
          status: ReservationStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: ReservationPaymentStatus.PAID,
          paidMinor: receivedMinor,
          paymentReference: transactionUuid,
          paymentFormToken: null,
          paymentSessionStatus: 'PAID',
          paymentSessionOwner: null,
          paymentSessionExpiresAt: null,
        },
      });

      if (updateResult.count === 0) {
        // Carrera concurrente: otra petición completó la transición a PAID o ya no está PENDING
        return { transitionLost: true as const };
      }

      // B. Consumo atómico condicional de cupón con límite (Ticket P1, P1.2, P1.3, P1.4)
      if (reservation.couponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: reservation.couponId } });
        if (coupon && coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
          let exhausted = false;
          if (coupon.usageLimit <= 0) {
            exhausted = true;
          } else {
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
              exhausted = true;
            }
          }

          if (exhausted) {
            // Capacidad de cupón agotada: preservar el dinero capturado y referencia sin fingir éxito comercial
            await tx.reservation.update({
              where: { id: reservation.id },
              data: {
                status: ReservationStatus.PENDING,
                bookingStatus: BookingStatus.PENDING,
                paymentStatus: ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW,
                paidMinor: receivedMinor,
                paymentReference: transactionUuid,
                paymentFormToken: null,
                paymentSessionStatus: 'REVIEW',
                paymentSessionOwner: null,
                paymentSessionExpiresAt: null,
              },
            });
            await tx.reservationEvent.create({
              data: {
                reservationId: reservation.id,
                actorId: 'system',
                actorLabel: 'system:izipay-ipn',
                toStatus: reservation.operationStatus || OperationalStatus.PENDING,
                note: `[AUDIT: COUPON_OVERALLOCATED_REVIEW] Cupón "${coupon.code}" agotó su cupo (${coupon.usageLimit}) concurrentemente tras captura de pago. Transacción: ${transactionUuid}`,
              },
            });
            return {
              transitionLost: false as const,
              success: false,
              status: 'REVIEW_REQUIRED',
              reviewReason: 'COUPON_CAPACITY_EXHAUSTED',
            };
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

      return {
        transitionLost: false as const,
        success: true,
        status: 'PAID',
        paidMinor: receivedMinor,
      };
    });

    if (txResult.transitionLost) {
      // Re-consultar estado final autoritativo en base de datos para responder fielmente (P1.3)
      const reloaded = await this.prisma.reservation.findUnique({
        where: { id: reservation.id },
      });
      if (reloaded?.paymentStatus === ReservationPaymentStatus.PAID) {
        return {
          success: true,
          reservationCode: reloaded.code || orderDetails.orderId,
          status: 'PAID',
          paidMinor: reloaded.paidMinor,
        };
      }
      if (reloaded?.paymentStatus === ReservationPaymentStatus.PAYMENT_RECEIVED_REVIEW) {
        return {
          success: false,
          reservationCode: reloaded.code || orderDetails.orderId,
          status: 'REVIEW_REQUIRED',
          reviewReason: 'RESERVATION_UNDER_FINANCIAL_REVIEW',
        };
      }
      return {
        success: false,
        reservationCode: reloaded?.code || orderDetails.orderId,
        status: reloaded?.paymentStatus || 'UNKNOWN',
        reviewReason: 'STATE_TRANSITION_FAILED',
      };
    }

    return {
      success: txResult.success,
      reservationCode: reservation.code || orderDetails.orderId,
      status: txResult.status,
      paidMinor: txResult.paidMinor,
      reviewReason: txResult.reviewReason,
    };
  }
}
