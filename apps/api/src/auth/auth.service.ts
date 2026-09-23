import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hashSync } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
// A valid hash avoids skipping password work for unknown accounts.
const dummyHash = hashSync(randomBytes(32).toString('hex'), 10);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, agencySlug: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const matches = await compare(password, user?.password ?? dummyHash);
    const now = new Date();
    if (!user || !user.isActive || (user.lockedUntil && user.lockedUntil > now)) {
      throw new UnauthorizedException();
    }
    if (!matches) {
      // Start a new attempt window after an expired lock, without overwriting a concurrent new lock.
      await this.prisma.user.updateMany({
        where: { id: user.id, lockedUntil: { lte: now } },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: { increment: 1 } } });
      await this.prisma.user.updateMany({
        where: { id: user.id, failedLoginAttempts: { gte: 5 } },
        data: { lockedUntil: new Date(Date.now() + 15 * 60_000) },
      });
      throw new UnauthorizedException();
    }
    const membership = await this.prisma.agencyMembership.findFirst({
      where: { userId: user.id, isActive: true, agency: { slug: agencySlug, isActive: true } },
    });
    if (!membership) throw new UnauthorizedException();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60_000);
    await this.prisma.$transaction([
      this.prisma.apiSession.create({ data: {
        membershipId: membership.id, tokenHash: digest(token),
        tokenVersion: user.tokenVersion, passwordHash: digest(user.password), expiresAt,
      } }),
      this.prisma.user.update({ where: { id: user.id }, data: {
        failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now,
      } }),
    ]);
    return { accessToken: token, tokenType: 'Bearer' as const, expiresAt, agencyId: membership.agencyId };
  }

  async authenticate(authorization: string | undefined) {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization ?? '');
    if (!match?.[1]) throw new UnauthorizedException();
    const session = await this.prisma.apiSession.findUnique({
      where: { tokenHash: digest(match[1]) },
      include: { membership: { include: { user: true, agency: true } } },
    });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) throw new UnauthorizedException();
    const { membership } = session;
    const { user, agency } = membership;
    if (!membership.isActive || !agency.isActive || !user.isActive ||
        (user.lockedUntil && user.lockedUntil > now) ||
        user.tokenVersion !== session.tokenVersion || digest(user.password) !== session.passwordHash) {
      throw new UnauthorizedException();
    }
    return Object.freeze({
      sessionId: session.id, userId: user.id, email: user.email,
      agencyId: agency.id, membershipId: membership.id, role: membership.role,
      agencyName: agency.name, agencySlug: agency.slug,
    });
  }

  async logout(sessionId: string) {
    await this.prisma.apiSession.updateMany({
      where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() },
    });
  }
}

export type ApiIdentity = Awaited<ReturnType<AuthService['authenticate']>>;
