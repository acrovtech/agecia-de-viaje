import { Role } from '@repo/db';

export interface RoleMetadata {
  key: Role;
  label: string;
  shortDescription: string;
  badgeClass: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleMetadata> = {
  SUPERADMIN: {
    key: 'SUPERADMIN',
    label: 'Super Admin (Root)',
    shortDescription: 'Control total de la infraestructura, seguridad avanzada y acceso exclusivo al visor de Logs de Auditoría forense.',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    permissions: [
      'Acceso exclusivo a la bitácora de Logs de Auditoría',
      'Gestión y revocación de cualquier usuario y rol',
      'Control integral de seguridad y sesiones activas',
      'Todas las facultades de Administrador Master',
    ],
  },
  MASTER: {
    key: 'MASTER',
    label: 'Administrador Master',
    shortDescription: 'Acceso total y sin restricciones a todos los módulos, gestión de usuarios, transporte privado y configuraciones críticas.',
    badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
    permissions: [
      'Gestión integral de usuarios y roles',
      'Configuración de transportes y tarifas privadas',
      'Control total de tours, precios e itinerarios',
      'Aprobación y reprogramación de reservas',
      'Gestión de blogs, categorías y megamenú',
      'Auditoría y trazabilidad del sistema',
    ],
  },
  OPERATOR: {
    key: 'OPERATOR',
    label: 'Operador de Reservas',
    shortDescription: 'Gestión operativa de reservas, manifiesto de pasajeros, cobros, estados de pago y consulta de transportes y tours.',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    permissions: [
      'Visualización y filtrado de reservas',
      'Modificación de estados de pago (PENDING / PAID / CANCELLED)',
      'Manifiesto y datos de pasajeros',
      'Asignación de operadores a reservas',
      'Consulta de tarifas y vehículos',
    ],
  },
  CONTENT_CREATOR: {
    key: 'CONTENT_CREATOR',
    label: 'Equipo de Marketing',
    shortDescription: 'Gestión de email marketing, base de contactos de clientes, redacción de blogs, catálogo de tours y contenidos.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    permissions: [
      'Acceso a Email Marketing y base de clientes',
      'Creación y edición de Tours y catálogo',
      'Gestión de blogs y artículos promocionales',
      'Administración de Categorías de tours',
      'Diseño y links del menú de navegación',
    ],
  },
};

export function getRoleMetadata(roleString?: string | null): RoleMetadata {
  if (!roleString) return ROLE_DEFINITIONS.OPERATOR;
  const normalized = roleString === 'CLIENT' ? 'CONTENT_CREATOR' : roleString;
  if (normalized in ROLE_DEFINITIONS) {
    return ROLE_DEFINITIONS[normalized as Role];
  }
  return {
    key: 'OPERATOR',
    label: roleString,
    shortDescription: 'Rol asignado',
    badgeClass: 'bg-slate-500 text-white border-slate-600',
    permissions: [],
  };
}
