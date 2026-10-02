import type { NavIdentity } from '../design-system/sidebar';

export type { NavIdentity };

export interface AgencyProfileData {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description?: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  updatedAt: string;
}

export interface LegalProfileData {
  id: string;
  agencyId: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  fiscalAddress: string;
  legalRepresentative: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  updatedAt: string;
}

export interface SettingsActionState {
  success?: boolean;
  error?: string;
  updatedAt?: string;
}
