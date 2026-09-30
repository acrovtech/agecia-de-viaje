import { normalizeHost } from '../tenant/host-normalizer.js';

export interface AgencyDomainInfo {
  subdomain?: string | null;
  customDomain?: string | null;
}

export function buildCanonicalAgencyOrigin(
  agency: AgencyDomainInfo,
  storefrontBaseDomain: string,
): string {
  if (agency.customDomain) {
    const host = normalizeHost(agency.customDomain);
    if (host) {
      return `https://${host}`;
    }
  }

  const base = normalizeHost(storefrontBaseDomain);
  if (agency.subdomain && base) {
    const sub = normalizeHost(agency.subdomain);
    if (sub) {
      return `https://${sub}.${base}`;
    }
  }

  if (base) {
    return `https://${base}`;
  }

  return 'https://platform.example';
}

export function buildCanonicalAgencyUrl(
  agency: AgencyDomainInfo,
  storefrontBaseDomain: string,
  path: string,
): string {
  const origin = buildCanonicalAgencyOrigin(agency, storefrontBaseDomain);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}
