import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hashSync } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const dummyHash = hashSync(randomBytes(32).toString('hex'), 10);

@Injectable()
export class PlatformAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    const matches = await compare(password, admin?.password ?? dummyHash);
    const now = new Date();

    if (!admin || !admin.isActive || (admin.lockedUntil && admin.lockedUntil > now)) {
      throw new UnauthorizedException();
    }

    if (!matches) {
      await this.prisma.platformAdmin.updateMany({
        where: { id: admin.id, lockedUntil: { lte: now } },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      await this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      await this.prisma.platformAdmin.updateMany({
        where: { id: admin.id, failedLoginAttempts: { gte: 5 } },
        data: { lockedUntil: new Date(Date.now() + 15 * 60_000) },
      });
      throw new UnauthorizedException();
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60_000); // 8 horas

    await this.prisma.$transaction([
      this.prisma.platformSession.create({
        data: {
          platformAdminId: admin.id,
          tokenHash: digest(token),
          tokenVersion: admin.tokenVersion,
          passwordHash: digest(admin.password),
          expiresAt,
        },
      }),
      this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      }),
      this.prisma.platformAuditLog.create({
        data: {
          platformAdminId: admin.id,
          action: 'PLATFORM_LOGIN_SUCCESS',
          entity: 'PlatformAdmin',
          entityId: admin.id,
          details: { email: admin.email },
        },
      }),
    ]);

    return {
      accessToken: token,
      tokenType: 'Bearer' as const,
      expiresAt,
      admin: {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
    };
  }

  async authenticate(authorization: string | undefined) {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization ?? '');
    if (!match?.[1]) throw new UnauthorizedException();

    const session = await this.prisma.platformSession.findUnique({
      where: { tokenHash: digest(match[1]) },
      include: { platformAdmin: true },
    });

    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException();
    }

    const { platformAdmin } = session;
    if (
      !platformAdmin.isActive ||
      (platformAdmin.lockedUntil && platformAdmin.lockedUntil > now) ||
      platformAdmin.tokenVersion !== session.tokenVersion ||
      digest(platformAdmin.password) !== session.passwordHash
    ) {
      throw new UnauthorizedException();
    }

    return Object.freeze({
      platformAdminId: platformAdmin.id,
      email: platformAdmin.email,
      role: platformAdmin.role,
      displayName: platformAdmin.displayName,
      sessionId: session.id,
    });
  }

  async logout(sessionId: string) {
    await this.prisma.platformSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export type PlatformIdentity = Awaited<ReturnType<PlatformAuthService['authenticate']>>;
