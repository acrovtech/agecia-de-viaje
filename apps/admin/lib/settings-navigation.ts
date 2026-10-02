export type SettingsSectionId =
  | 'overview'
  | 'profile'
  | 'general'
  | 'appearance'
  | 'referrals'
  | 'billing'
  | 'plans'
  | 'security'
  | 'security-legal'
  | 'social'
  | 'integrations';

export type SettingsGroupId =
  | 'root'
  | 'account'
  | 'security'
  | 'billing'
  | 'social'
  | 'integrations';

export interface SettingsRouteConfig {
  id: SettingsSectionId;
  groupId: SettingsGroupId;
  groupLabel?: string;
  label: string;
  href: string;
  legacyTab?: string;
  title: string;
  description: string;
  status: 'active' | 'preview' | 'future';
  statusLabel?: string;
}

export const SETTINGS_NAV_ITEMS: SettingsRouteConfig[] = [
  {
    id: 'overview',
    groupId: 'root',
    label: 'Resumen',
    href: '/settings',
    legacyTab: 'resumen',
    title: 'Configuración',
    description: 'Administra la identidad de tu agencia, preferencias del sistema, facturación, planes y seguridad.',
    status: 'active',
  },
  {
    id: 'profile',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Perfil',
    href: '/settings/profile',
    legacyTab: 'perfil',
    title: 'Perfil',
    description: 'Gestiona tu información de cuenta, credenciales de acceso y sesión activa.',
    status: 'active',
  },
  {
    id: 'general',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'General',
    href: '/settings/general',
    legacyTab: 'general',
    title: 'General',
    description: 'Configura el idioma, zona horaria, formato horario y resumen mensual por correo.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
  {
    id: 'appearance',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Aspecto',
    href: '/settings/appearance',
    legacyTab: 'aspecto',
    title: 'Aspecto',
    description: 'Personaliza los temas del sistema, la paleta de identidad y los logotipos de tu marca.',
    status: 'active',
  },
  {
    id: 'referrals',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Gana 20% de referencia',
    href: '/settings/referrals',
    legacyTab: 'referidos',
    title: 'Gana por referenciado',
    description: 'Monitorea tus ingresos, comisiones acumuladas y comparte tu enlace de recomendación.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
  {
    id: 'security-legal',
    groupId: 'security',
    groupLabel: 'Seguridad',
    label: 'Perfil legal',
    href: '/settings/security/legal',
    legacyTab: 'seguridad',
    title: 'Perfil Legal y Fiscal',
    description: 'Gestiona el perfil fiscal y legal de tu empresa (RUC) y audita las sesiones del sistema.',
    status: 'active',
  },
  {
    id: 'billing',
    groupId: 'billing',
    groupLabel: 'Facturación',
    label: 'Gestione la facturación',
    href: '/settings/billing',
    legacyTab: 'facturacion',
    title: 'Gestione la Facturación',
    description: 'Administra tu suscripción activa, saldo de créditos disponibles y registro histórico de gastos.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
  {
    id: 'plans',
    groupId: 'billing',
    groupLabel: 'Facturación',
    label: 'Planes',
    href: '/settings/plans',
    legacyTab: 'planes',
    title: 'Planes',
    description: 'Explora y escala a planes con mayores capacidades para tu agencia de viajes.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
  {
    id: 'social',
    groupId: 'social',
    groupLabel: 'Página social',
    label: 'Link in Bio',
    href: '/settings/social',
    legacyTab: 'social',
    title: 'Página Social',
    description: 'Configura tu link-in-bio móvil para viajeros con accesos directos, tours y contacto WhatsApp.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
  {
    id: 'integrations',
    groupId: 'integrations',
    groupLabel: 'Integraciones',
    label: 'Pasarelas y APIs',
    href: '/settings/integrations',
    legacyTab: 'integraciones',
    title: 'Integraciones',
    description: 'Conecta pasarelas de pago, calendarios y mensajería en la nube.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
  },
];

export function getSettingsConfigByPath(pathname: string): SettingsRouteConfig {
  const normalized = pathname.replace(/\/$/, '') || '/settings';
  const match = SETTINGS_NAV_ITEMS.find((item) => item.href === normalized);
  if (match) return match;
  if (normalized.startsWith('/settings/security')) {
    return (
      SETTINGS_NAV_ITEMS.find((item) => item.id === 'security-legal') || SETTINGS_NAV_ITEMS[0]!
    );
  }
  return SETTINGS_NAV_ITEMS[0]!;
}

export function getSettingsConfigByLegacyTab(tab: string | null | undefined): SettingsRouteConfig | null {
  if (!tab) return null;
  return SETTINGS_NAV_ITEMS.find((item) => item.legacyTab === tab) || null;
}
