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
    badgeClass: 'bg-slate-900 text-white border border-slate-800',
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
    label: 'Gestor de Contenidos',
    shortDescription: 'Creación, edición y publicación de paquetes turísticos, itinerarios, galerías, blogs y menús de navegación.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    permissions: [
      'Creación y edición de Tours',
      'Gestión de itinerarios, inclusiones y precios',
      'Redacción y publicación de Blogs',
      'Administración de Categorías de tours',
      'Diseño y links del Megamenú público',
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
