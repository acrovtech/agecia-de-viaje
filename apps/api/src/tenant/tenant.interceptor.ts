import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { normalizeHost } from './host-normalizer.js';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config.js';
import { StorefrontResolverService } from './storefront-resolver.service.js';
import { TenantService } from './tenant.service.js';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantService: TenantService,
    private readonly resolverService: StorefrontResolverService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const storefront = request.params?.storefront;

    if (storefront) {
      const resolvedTenant = await this.tenantService.resolve(storefront);

      // Verify consistency between path storefront and request host (prevent tenant confusion)
      let incomingHost: string | undefined;
      if (this.config.storefrontTrustForwardedHost) {
        const forwarded = request.headers['x-forwarded-host'];
        incomingHost = typeof forwarded === 'string' ? forwarded : Array.isArray(forwarded) ? forwarded[0] : undefined;
      }
      if (!incomingHost) {
        incomingHost = request.headers.host;
      }

      if (incomingHost) {
        const normalized = normalizeHost(incomingHost);
        // Only enforce cross-check if the host is a tenant-identifying host (not local API loopback IP)
        if (normalized && normalized !== 'localhost' && normalized !== '127.0.0.1' && normalized !== '[::1]') {
          const hostContext = await this.resolverService.resolveSafe(normalized);
          if (hostContext && hostContext.slug !== resolvedTenant.slug) {
            throw new ForbiddenException('Storefront host mismatch with route tenant slug');
          }
        }
      }

      request.tenant = resolvedTenant;
    }

    return next.handle();
  }
}
