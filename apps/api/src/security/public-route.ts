import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AgencyMemberRole } from '@repo/db/prisma';
import { AuthService } from '../auth/auth.service.js';
import { API_CONFIG, type ApiConfig } from '../config.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';

const PUBLIC_ROUTE = 'api:public-route';
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE, true);
const SESSION_ROUTE = 'api:session';
const AGENCY_ROLES = 'api:agency-roles';
export const SessionRoute = () => SetMetadata(SESSION_ROUTE, true);
export const AgencyRoles = (...roles: AgencyMemberRole[]) => SetMetadata(AGENCY_ROLES, roles);

/** Unclassified routes remain closed, even for an authenticated caller. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) {
      return true;
    }
    const targets = [context.getHandler(), context.getClass()];
    const roles = this.reflector.getAllAndOverride<AgencyMemberRole[]>(AGENCY_ROLES, targets);
    if (!this.config.authEnabled || (!roles && !this.reflector.getAllAndOverride<boolean>(SESSION_ROUTE, targets))) {
      throw new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.identity = await this.auth.authenticate(request.headers.authorization);
    if (roles && (request.params.agencyId !== request.identity.agencyId || !roles.includes(request.identity.role))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
