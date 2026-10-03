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

export type SettingsIconName =
  | 'layout-grid'
  | 'user'
  | 'sliders'
  | 'palette'
  | 'gift'
  | 'credit-card'
  | 'sparkles'
  | 'shield-check'
  | 'smartphone'
  | 'blocks';

export type SettingsBadgeVariant =
  | 'role'
  | 'neutral'
  | 'emerald'
  | 'amber'
  | 'amber-bordered'
  | 'blue'
  | 'indigo'
  | 'pink';

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
  iconName: SettingsIconName;
  overviewTitle?: string;
  overviewDescription?: string;
  overviewBadge?: string;
  overviewBadgeVariant?: SettingsBadgeVariant;
  overviewActionLabel?: string;
}

export interface SettingsGroupConfig {
  id: SettingsGroupId;
  label: string;
  iconName: 'agency' | 'shield-check' | 'credit-card' | 'smartphone' | 'blocks';
}

export const SETTINGS_GROUPS: SettingsGroupConfig[] = [
  { id: 'account', label: 'Configuración personal', iconName: 'agency' },
  { id: 'security', label: 'Seguridad', iconName: 'shield-check' },
  { id: 'billing', label: 'Facturación', iconName: 'credit-card' },
  { id: 'social', label: 'Página social', iconName: 'smartphone' },
  { id: 'integrations', label: 'Integraciones', iconName: 'blocks' },
];

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
    iconName: 'layout-grid',
  },
  {
    id: 'profile',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Perfil',
    href: '/settings/profile',
    legacyTab: 'perfil',
    title: 'Perfil',
    overviewTitle: 'Perfil de Usuario',
    description: 'Gestiona tu información de cuenta, credenciales de acceso y sesión activa.',
    overviewDescription: 'Credenciales personales, email de acceso y detalles de tu cuenta de operador.',
    status: 'active',
    iconName: 'user',
    overviewBadgeVariant: 'role',
    overviewActionLabel: 'Configurar cuenta',
  },
  {
    id: 'general',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'General',
    href: '/settings/general',
    legacyTab: 'general',
    title: 'General',
    overviewTitle: 'Configuración General',
    description: 'Configura el idioma, zona horaria, formato horario y resumen mensual por correo.',
    overviewDescription: 'Zona horaria, formato de hora, idioma y correo para el resumen ejecutivo mensual.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'sliders',
    overviewBadge: 'UTC-5',
    overviewBadgeVariant: 'emerald',
    overviewActionLabel: 'Ajustar parámetros',
  },
  {
    id: 'appearance',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Aspecto',
    href: '/settings/appearance',
    legacyTab: 'aspecto',
    title: 'Aspecto',
    overviewTitle: 'Aspecto e Identidad',
    description: 'Personaliza los temas del sistema, la paleta de identidad y los logotipos de tu marca.',
    overviewDescription: 'Paleta corporativa, selector de tema (claro/oscuro) y subida de logotipo y favicon.',
    status: 'active',
    iconName: 'palette',
    overviewBadge: '2 COLORES',
    overviewBadgeVariant: 'neutral',
    overviewActionLabel: 'Editar diseño',
  },
  {
    id: 'referrals',
    groupId: 'account',
    groupLabel: 'Cuenta',
    label: 'Gana 20% de referencia',
    href: '/settings/referrals',
    legacyTab: 'referidos',
    title: 'Gana por referenciado',
    overviewTitle: 'Gana por Referenciado',
    description: 'Monitorea tus ingresos, comisiones acumuladas y comparte tu enlace de recomendación.',
    overviewDescription: 'Tu enlace de recomendación, dashboard de comisiones y registro de ganancias.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'gift',
    overviewBadge: '20% RECURRENTE',
    overviewBadgeVariant: 'amber',
    overviewActionLabel: 'Ver comisiones',
  },
  {
    id: 'security-legal',
    groupId: 'security',
    groupLabel: 'Seguridad',
    label: 'Perfil legal',
    href: '/settings/security/legal',
    legacyTab: 'seguridad',
    title: 'Perfil Legal y Fiscal',
    overviewTitle: 'Seguridad y Perfil Legal',
    description: 'Gestiona el perfil fiscal y legal de tu empresa (RUC) y audita las sesiones del sistema.',
    overviewDescription: 'Razón social, RUC de 11 dígitos, domicilio tributario y sesiones autorizadas.',
    status: 'active',
    iconName: 'shield-check',
    overviewBadge: 'RUC FISCAL',
    overviewBadgeVariant: 'neutral',
    overviewActionLabel: 'Datos fiscales',
  },
  {
    id: 'billing',
    groupId: 'billing',
    groupLabel: 'Facturación',
    label: 'Gestione la facturación',
    href: '/settings/billing',
    legacyTab: 'facturacion',
    title: 'Gestione la Facturación',
    overviewTitle: 'Facturación y Créditos',
    description: 'Administra tu suscripción activa, saldo de créditos disponibles y registro histórico de gastos.',
    overviewDescription: 'Gestión de tu suscripción SaaS, historial mensual de gastos y saldo de créditos.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'credit-card',
    overviewBadge: 'PRO',
    overviewBadgeVariant: 'blue',
    overviewActionLabel: 'Administrar pagos',
  },
  {
    id: 'plans',
    groupId: 'billing',
    groupLabel: 'Facturación',
    label: 'Planes',
    href: '/settings/plans',
    legacyTab: 'planes',
    title: 'Planes',
    overviewTitle: 'Planes de la Plataforma',
    description: 'Explora y escala a planes con mayores capacidades para tu agencia de viajes.',
    overviewDescription: 'Comparativa de planes Starter, Pro y Enterprise con capacidades y límites.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'sparkles',
    overviewBadge: 'UPGRADE',
    overviewBadgeVariant: 'indigo',
    overviewActionLabel: 'Explorar planes',
  },
  {
    id: 'social',
    groupId: 'social',
    groupLabel: 'Página social',
    label: 'Link in Bio',
    href: '/settings/social',
    legacyTab: 'social',
    title: 'Página Social',
    overviewTitle: 'Página Social (Bio Link)',
    description: 'Configura tu link-in-bio móvil para viajeros con accesos directos, tours y contacto WhatsApp.',
    overviewDescription: 'Página móvil para Instagram/TikTok con tus mejores tours y botón directo de WhatsApp.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'smartphone',
    overviewBadge: 'TRAVEL LINK',
    overviewBadgeVariant: 'pink',
    overviewActionLabel: 'Personalizar bio',
  },
  {
    id: 'integrations',
    groupId: 'integrations',
    groupLabel: 'Integraciones',
    label: 'Pasarelas y APIs',
    href: '/settings/integrations',
    legacyTab: 'integraciones',
    title: 'Integraciones',
    overviewTitle: 'Integraciones y Pasarelas',
    description: 'Conecta pasarelas de pago, calendarios y mensajería en la nube.',
    overviewDescription: 'Conexión con pasarelas de pago, Google Calendar, WhatsApp Cloud y APIs.',
    status: 'preview',
    statusLabel: 'Vista preliminar',
    iconName: 'blocks',
    overviewBadge: 'PROVEEDOR DIFERIDO',
    overviewBadgeVariant: 'amber-bordered',
    overviewActionLabel: 'Ver integraciones',
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

export function getSettingsNavSections() {
  return SETTINGS_GROUPS.map((group) => ({
    ...group,
    items: SETTINGS_NAV_ITEMS.filter((item) => item.groupId === group.id),
  }));
}

export function getSettingsOverviewCards(): SettingsRouteConfig[] {
  return SETTINGS_NAV_ITEMS.filter((item) => item.id !== 'overview');
}
