import {
  ConflictException,
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
import { buildInvitationAcceptUrl } from './canonical-url.js';
import { renderNotificationTemplate } from './templates/template-renderer.js';
import {
  EMAIL_TRANSPORT_ADAPTER,
  EmailTransportAdapter,
} from './transport/email-transport.interface.js';

/**
 * Maximum number of manual retries allowed per notification.
 * Each manual retry grants up to MANUAL_RETRY_BUDGET additional attempts.
 * Total manual retries are bounded by this constant.
 */
const MAX_MANUAL_RETRIES = 3;
const MANUAL_RETRY_BUDGET = 3;

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

const summarySelect = {
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
} satisfies Prisma.TransactionalNotificationSelect;

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
   * Processes a single claimed job. Validates lease ownership before external send.
   * BLOCKER 4: A worker whose lease expired/was reclaimed must NOT send.
   */
  async processJob(
    workerIdOrJob: string | TransactionalNotification,
    maybeJob?: TransactionalNotification,
  ): Promise<{ success: boolean; state: NotificationState; skipped?: boolean }> {
    const workerId = typeof workerIdOrJob === 'string' ? workerIdOrJob : (workerIdOrJob.claimedBy ?? '');
    const job = typeof workerIdOrJob === 'string' ? maybeJob! : workerIdOrJob;

    // Email disabled behavior: return without burning attempts or converting to FAILED.
    if (!this.config.emailDeliveryEnabled) {
      return { success: false, state: 'PENDING', skipped: true };
    }

    // Validate lease ownership BEFORE any external I/O.
    const current = await this.prisma.transactionalNotification.findUnique({
      where: { id: job.id },
      select: { state: true, claimedBy: true, claimExpiresAt: true },
    });

    if (
      !current ||
      current.state !== 'PROCESSING' ||
      current.claimedBy !== workerId ||
      !current.claimExpiresAt ||
      current.claimExpiresAt <= new Date()
    ) {
      // Lease lost/expired/reclaimed. Do NOT send.
      return { success: false, state: current?.state ?? 'PENDING', skipped: true };
    }

    const newAttempts = job.attempts + 1;
    const now = new Date();
    const firstAttemptAt = job.firstAttemptAt ?? now;

    // 1. Decrypt payload
    let payloadData: Record<string, any>;
    try {
      if (!this.config.notificationPayloadKey) {
        throw new Error('Key not configured');
      }
      const envelope = JSON.parse(job.encryptedPayload);
      payloadData = decryptPayload<Record<string, any>>(envelope, this.config.notificationPayloadKey);
    } catch {
      await this.conditionalUpdate(job.id, workerId, {
        state: 'DEAD_LETTER',
        failureCode: 'DECRYPTION_FAILURE',
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        claimedBy: null,
        claimExpiresAt: null,
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
      await this.conditionalUpdate(job.id, workerId, {
        state: 'DEAD_LETTER',
        failureCode: 'CONFIG_ERROR',
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        claimedBy: null,
        claimExpiresAt: null,
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // 3. For invitation, construct canonical URL using ADMIN_PUBLIC_ORIGIN
    if (job.kind === 'MEMBERSHIP_INVITATION' && payloadData.rawToken) {
      const adminOrigin = this.config.adminPublicOrigin;
      if (!adminOrigin) {
        // Fail-closed: cannot construct authoritative invitation URL without configured origin.
        await this.conditionalUpdate(job.id, workerId, {
          state: 'DEAD_LETTER',
          failureCode: 'CONFIG_ERROR',
          attempts: newAttempts,
          firstAttemptAt,
          lastAttemptAt: now,
          claimedBy: null,
          claimExpiresAt: null,
        });
        return { success: false, state: 'DEAD_LETTER' };
      }
      payloadData.invitationUrl = buildInvitationAcceptUrl(adminOrigin, payloadData.rawToken);
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
      await this.conditionalUpdate(job.id, workerId, {
        state: 'DEAD_LETTER',
        failureCode: 'TEMPLATE_FAILURE',
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        claimedBy: null,
        claimExpiresAt: null,
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
      await this.conditionalUpdate(job.id, workerId, {
        state: 'SENT',
        sentAt: now,
        providerMessageId: delivery.providerMessageId,
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        failureCode: null,
        claimedBy: null,
        claimExpiresAt: null,
      });
      return { success: true, state: 'SENT' };
    }

    // 6. Handle transport failure
    const isExhausted = newAttempts >= job.maxAttempts;
    const isPermanent = delivery.retryable === false || isExhausted;

    if (isPermanent) {
      await this.conditionalUpdate(job.id, workerId, {
        state: 'DEAD_LETTER',
        failureCode: delivery.failureCode || 'TEMPORARY_PROVIDER_FAILURE',
        attempts: newAttempts,
        firstAttemptAt,
        lastAttemptAt: now,
        claimedBy: null,
        claimExpiresAt: null,
      });
      return { success: false, state: 'DEAD_LETTER' };
    }

    // Schedule retry with exponential backoff
    const backoffSeconds = this.calculateBackoff(newAttempts);
    const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

    await this.conditionalUpdate(job.id, workerId, {
      state: 'PENDING',
      failureCode: delivery.failureCode || 'TEMPORARY_PROVIDER_FAILURE',
      attempts: newAttempts,
      firstAttemptAt,
      lastAttemptAt: now,
      nextAttemptAt,
      claimedBy: null,
      claimExpiresAt: null,
    });

    return { success: false, state: 'PENDING' };
  }

  /**
   * Conditional update that only applies if the worker still owns the lease.
   * Prevents stale workers from overwriting state after lease expiry/reclaim.
   */
  private async conditionalUpdate(
    jobId: string,
    workerId: string,
    data: Record<string, any>,
  ): Promise<void> {
    await this.prisma.transactionalNotification.updateMany({
      where: {
        id: jobId,
        claimedBy: workerId,
        state: 'PROCESSING',
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Processes all claimed jobs sequentially without holding open database transactions.
   * If email delivery is disabled, returns immediately without claiming jobs.
   */
  async processBatch(workerId: string, limit = 10, leaseSeconds = 300) {
    // Disabled delivery: do not claim, do not burn attempts.
    if (!this.config.emailDeliveryEnabled) {
      return [];
    }

    const jobs = await this.claimJobs(workerId, limit, leaseSeconds);
    const results = [];
    for (const job of jobs) {
      const res = await this.processJob(workerId, job);
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
      select: summarySelect,
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
      select: summarySelect,
    });

    if (!row) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return row;
  }

  /**
   * BLOCKER 3: State-safe, race-safe manual retry using CAS conditional update.
   *
   * Only FAILED and DEAD_LETTER states are retryable.
   * Manual retries are bounded by MAX_MANUAL_RETRIES (default 3).
   * Each retry grants MANUAL_RETRY_BUDGET additional attempts.
   *
   * The state update and AdminAuditLog insertion are atomic within a single transaction.
   * Concurrent retry attempts receive 409 Conflict.
   */
  async manualRetry(
    who: ApiIdentity,
    agencyId: string,
    id: string,
  ): Promise<NotificationSummary> {
    return await this.prisma.$transaction(async (tx) => {
      const maxAllowedAttempts = 5 + MAX_MANUAL_RETRIES * MANUAL_RETRY_BUDGET;

      // CAS conditional update: only transitions from FAILED or DEAD_LETTER, bounded by maxAttempts
      const updated = await tx.transactionalNotification.updateMany({
        where: {
          id,
          agencyId,
          state: { in: ['FAILED', 'DEAD_LETTER'] },
          maxAttempts: { lt: maxAllowedAttempts },
        },
        data: {
          state: 'PENDING',
          nextAttemptAt: new Date(),
          maxAttempts: { increment: MANUAL_RETRY_BUDGET },
          claimedBy: null,
          claimExpiresAt: null,
          failureCode: null,
          updatedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        // Either not found, wrong agency, reached retry limit, or state was not FAILED/DEAD_LETTER
        const exists = await tx.transactionalNotification.findFirst({
          where: { id, agencyId },
          select: { state: true, maxAttempts: true },
        });
        if (!exists) {
          throw new NotFoundException('Notificación no encontrada');
        }
        if (exists.maxAttempts >= maxAllowedAttempts) {
          throw new ConflictException(
            `Límite de reintentos manuales alcanzado para esta notificación (máximo ${MAX_MANUAL_RETRIES} reintentos permitidos).`,
          );
        }
        throw new ConflictException(
          `No se puede reintentar la notificación en estado ${exists.state}. ` +
          `Solo se permite reintentar notificaciones con estado FAILED o DEAD_LETTER.`,
        );
      }

      // Audit log INSIDE the same transaction
      await tx.adminAuditLog.create({
        data: {
          userId: who.userId,
          action: 'MANUAL_RETRY_NOTIFICATION',
          entity: 'TransactionalNotification',
          entityId: id,
          details: {
            agencyId,
            retryBudget: MANUAL_RETRY_BUDGET,
            maxManualRetries: MAX_MANUAL_RETRIES,
          },
        },
      });

      // Return the updated row
      const row = await tx.transactionalNotification.findFirst({
        where: { id, agencyId },
        select: summarySelect,
      });

      if (!row) {
        throw new NotFoundException('Notificación no encontrada');
      }

      return row;
    });
  }
}
