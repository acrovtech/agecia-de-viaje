import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type NotificationAudience,
  type NotificationKind,
  type NotificationState,
  type TransactionalNotification,
} from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import { decryptPayload, encryptPayload } from './encryption.js';
import { buildCanonicalAgencyUrl } from './canonical-url.js';
import { renderNotificationTemplate } from './templates/template-renderer.js';
import {
  EMAIL_TRANSPORT_ADAPTER,
  EmailTransportAdapter,
  FailureCode,
} from './transport/email-transport.interface.js';

export interface QueueNotificationInput {
  agencyId: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  recipient: string;
  subject: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
}

export interface NotificationSummary {
  id: string;
  agencyId: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  recipient: string;
  subject: string;
  state: NotificationState;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  firstAttemptAt: Date | null;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  failureCode: string | null;
  providerMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(EMAIL_TRANSPORT_ADAPTER) private readonly transport: EmailTransportAdapter,
  ) {}

  /**
   * Enqueues a transactional notification atomically within a Prisma transaction client.
   * Encrypts sensitive payload with AES-256-GCM.
   */
  async queueNotification(
    tx: Prisma.TransactionClient,
    input: QueueNotificationInput,
  ): Promise<TransactionalNotification> {
    const key = this.config.notificationPayloadKey;
    if (!key) {
      throw new Error(
        'CONFIG_ERROR: NOTIFICATION_PAYLOAD_KEY no está configurada para encriptar la carga útil de la notificación',
      );
    }

    const envelope = encryptPayload(input.payload, key);

    return await tx.transactionalNotification.upsert({
      where: {
        agencyId_idempotencyKey: {
          agencyId: input.agencyId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      create: {
        agencyId: input.agencyId,
        kind: input.kind,
        audience: input.audience,
        recipient: input.recipient,
        subject: input.subject,
        encryptedPayload: JSON.stringify(envelope),
        idempotencyKey: input.idempotencyKey,
        state: 'PENDING',
        attempts: 0,
        maxAttempts: input.maxAttempts ?? 5,
        nextAttemptAt: new Date(),
      },
      update: {},
    });
  }

  /**
   * Concurrent-safe job claiming using PostgreSQL FOR UPDATE SKIP LOCKED.
   */
  async claimJobs(
    workerId: string,
    limit = 10,
    leaseSeconds = 300,
  ): Promise<TransactionalNotification[]> {
    const sql = `
      WITH due_jobs AS (
        SELECT "id"
        FROM "TransactionalNotification"
        WHERE
          ("state" = 'PENDING'::"NotificationState" AND "nextAttemptAt" <= NOW())
          OR ("state" = 'PROCESSING'::"NotificationState" AND "claimExpiresAt" <= NOW())
        ORDER BY "nextAttemptAt" ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "TransactionalNotification" tn
      SET
        "state" = 'PROCESSING'::"NotificationState",
        "claimedBy" = $2,
        "claimExpiresAt" = NOW() + ($3 || ' seconds')::INTERVAL,
        "updatedAt" = NOW()
      FROM due_jobs
      WHERE tn."id" = due_jobs."id"
      RETURNING tn.*;
    `;

    return this.prisma.$queryRawUnsafe<TransactionalNotification[]>(
      sql,
      limit,
      workerId,
      leaseSeconds,
    );
  }

  /**
   * Processes a single claimed job.
   */
  async processJob(job: TransactionalNotification): Promise<{ success: boolean; state: NotificationState }> {
    const newAttempts = job.attempts + 1;
    const now = new Date();
    const firstAttemptAt = job.firstAttemptAt ?? now;

    // Fail-safe check: If email delivery is disabled, mark FAILED without sending.
    if (!this.config.emailDeliveryEnabled) {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'FAILED',
          failureCode: 'TRANSPORT_DISABLED',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: false, state: 'FAILED' };
    }

    // 1. Decrypt payload
    let payloadData: Record<string, any>;
    try {
      if (!this.config.notificationPayloadKey) {
        throw new Error('Key not configured');
      }
      const envelope = JSON.parse(job.encryptedPayload);
      payloadData = decryptPayload<Record<string, any>>(envelope, this.config.notificationPayloadKey);
    } catch {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'DEAD_LETTER',
          failureCode: 'DECRYPTION_FAILURE',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // 2. Fetch scoped agency branding and domain info
    const agency = await this.prisma.agency.findUnique({
      where: { id: job.agencyId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        logoUrl: true,
        email: true,
        phone: true,
      },
    });

    if (!agency) {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'DEAD_LETTER',
          failureCode: 'CONFIG_ERROR',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // 3. For invitation, construct canonical URL
    if (job.kind === 'MEMBERSHIP_INVITATION' && payloadData.rawToken) {
      payloadData.invitationUrl = buildCanonicalAgencyUrl(
        agency,
        this.config.storefrontBaseDomain,
        `/workspace/invitations/accept?token=${payloadData.rawToken}`,
      );
    }

    // 4. Render template
    let rendered;
    try {
      rendered = renderNotificationTemplate(job.kind, payloadData, {
        name: agency.name,
        logoUrl: agency.logoUrl,
        contactEmail: agency.email,
        phone: agency.phone,
      });
    } catch {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'DEAD_LETTER',
          failureCode: 'TEMPLATE_FAILURE',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // 5. Send through adapter
    const delivery = await this.transport.send({
      to: job.recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      from: {
        name: this.config.emailFromName || agency.name,
        address: this.config.emailFromAddress,
      },
      replyTo: agency.email || undefined,
    });

    if (delivery.success) {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'SENT',
          sentAt: now,
          providerMessageId: delivery.providerMessageId,
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          failureCode: null,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: true, state: 'SENT' };
    }

    // 6. Handle transport failure
    const isExhausted = newAttempts >= job.maxAttempts;
    const isPermanent = delivery.retryable === false || isExhausted;

    if (isPermanent) {
      await this.prisma.transactionalNotification.update({
        where: { id: job.id },
        data: {
          state: 'DEAD_LETTER',
          failureCode: delivery.failureCode || 'TEMPORARY_PROVIDER_FAILURE',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        },
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // Schedule retry with exponential backoff
    const backoffSeconds = this.calculateBackoff(newAttempts);
    const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

    await this.prisma.transactionalNotification.update({
      where: { id: job.id },
      data: {
        state: 'PENDING',
        failureCode: delivery.failureCode || 'TEMPORARY_PROVIDER_FAILURE',
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        nextAttemptAt,
        claimedBy: null,
        claimExpiresAt: null,
      },
    });

    return { success: false, state: 'PENDING' };
  }

  /**
   * Processes all claimed jobs sequentially without holding open database transactions.
   */
  async processBatch(workerId: string, limit = 10, leaseSeconds = 300) {
    const jobs = await this.claimJobs(workerId, limit, leaseSeconds);
    const results = [];
    for (const job of jobs) {
      const res = await this.processJob(job);
      results.push({ id: job.id, ...res });
    }
    return results;
  }

  private calculateBackoff(attempt: number): number {
    if (process.env.NOTIFICATION_TEST_FAST_BACKOFF === 'true') {
      return 1;
    }
    switch (attempt) {
      case 1:
        return 60; // 1 min
      case 2:
        return 300; // 5 min
      case 3:
        return 1800; // 30 min
      default:
        return 3600; // 60 min
    }
  }

  // --- Admin API Methods ---

  async listNotifications(
    agencyId: string,
    query: { after?: string; state?: NotificationState; limit?: number },
  ) {
    const take = Math.min(query.limit ?? 25, 100);
    const rows = await this.prisma.transactionalNotification.findMany({
      where: {
        agencyId,
        ...(query.state ? { state: query.state } : {}),
        ...(query.after ? { id: { lt: query.after } } : {}),
      },
      select: {
        id: true,
        agencyId: true,
        kind: true,
        audience: true,
        recipient: true,
        subject: true,
        state: true,
        attempts: true,
        maxAttempts: true,
        nextAttemptAt: true,
        firstAttemptAt: true,
        lastAttemptAt: true,
        sentAt: true,
        failureCode: true,
        providerMessageId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'desc' },
      take: take + 1,
    });

    const hasMore = rows.length > take;
    const data = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return {
      data,
      nextCursor,
    };
  }

  async getNotification(agencyId: string, id: string): Promise<NotificationSummary> {
    const row = await this.prisma.transactionalNotification.findFirst({
      where: { id, agencyId },
      select: {
        id: true,
        agencyId: true,
        kind: true,
        audience: true,
        recipient: true,
        subject: true,
        state: true,
        attempts: true,
        maxAttempts: true,
        nextAttemptAt: true,
        firstAttemptAt: true,
        lastAttemptAt: true,
        sentAt: true,
        failureCode: true,
        providerMessageId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!row) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return row;
  }

  async manualRetry(
    who: ApiIdentity,
    agencyId: string,
    id: string,
  ): Promise<NotificationSummary> {
    const row = await this.prisma.transactionalNotification.findFirst({
      where: { id, agencyId },
    });

    if (!row) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (row.state === 'SENT') {
      throw new ConflictException('No se puede reintentar una notificación ya enviada');
    }

    if (row.state === 'PROCESSING' && row.claimExpiresAt && row.claimExpiresAt > new Date()) {
      throw new ConflictException('La notificación está siendo procesada actualmente');
    }

    // Reset state for retry, giving 3 more attempts
    const updated = await this.prisma.transactionalNotification.update({
      where: { id },
      data: {
        state: 'PENDING',
        nextAttemptAt: new Date(),
        maxAttempts: row.attempts + 3,
        claimedBy: null,
        claimExpiresAt: null,
        failureCode: null,
      },
      select: {
        id: true,
        agencyId: true,
        kind: true,
        audience: true,
        recipient: true,
        subject: true,
        state: true,
        attempts: true,
        maxAttempts: true,
        nextAttemptAt: true,
        firstAttemptAt: true,
        lastAttemptAt: true,
        sentAt: true,
        failureCode: true,
        providerMessageId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        userId: who.userId,
        action: 'MANUAL_RETRY_NOTIFICATION',
        entity: 'TransactionalNotification',
        entityId: id,
        details: {
          agencyId,
          previousState: row.state,
          previousAttempts: row.attempts,
        },
      },
    });

    return updated;
  }
}
