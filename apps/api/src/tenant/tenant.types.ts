export interface TenantContext {
  readonly agencyId: string;
  readonly slug: string;
  readonly name: string;
  readonly isActive: boolean;
}
