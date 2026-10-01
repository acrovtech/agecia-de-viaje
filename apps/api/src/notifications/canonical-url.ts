import { normalizeHost } from '../tenant/host-normalizer.js';

export interface AgencyDomainInfo {
  subdomain?: string | null;
  customDomain?: string | null;
}

/**
 * Builds the canonical public origin for an agency's storefront.
 * Fail-closed: returns null if no authoritative origin can be constructed.
 * Never returns placeholder domains like 'platform.example'.
 */
export function buildCanonicalAgencyOrigin(
  agency: AgencyDomainInfo,
  storefrontBaseDomain: string,
): string | null {
  if (agency.customDomain) {
    const host = normalizeHost(agency.customDomain);
    if (host) {
      return `https://${host}`;
    }
  }

  const base = normalizeHost(storefrontBaseDomain);
  // Reject placeholder domain
  if (base === 'platform.example') {
    return null;
  }

  if (agency.subdomain && base) {
    const sub = normalizeHost(agency.subdomain);
    if (sub) {
      return `https://${sub}.${base}`;
    }
  }

  if (base) {
    return `https://${base}`;
  }

  return null;
}

/**
 * Builds a full URL on the agency storefront domain.
 * Returns null if no authoritative origin can be constructed (fail-closed).
 */
export function buildCanonicalAgencyUrl(
  agency: AgencyDomainInfo,
  storefrontBaseDomain: string,
  path: string,
): string | null {
  const origin = buildCanonicalAgencyOrigin(agency, storefrontBaseDomain);
  if (!origin) return null;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Builds the canonical invitation acceptance URL using the ADMIN_PUBLIC_ORIGIN.
 * This is the authoritative URL sent in invitation emails.
 * The acceptance UI lives in the admin app, not the storefront.
 */
export function buildInvitationAcceptUrl(
  adminPublicOrigin: string,
  rawToken: string,
): string {
  if (!adminPublicOrigin) {
    throw new Error('CONFIG_ERROR: ADMIN_PUBLIC_ORIGIN no está configurado para generar URL de aceptación de invitación');
  }
  return `${adminPublicOrigin}/invitations/accept?token=${encodeURIComponent(rawToken)}`;
}
