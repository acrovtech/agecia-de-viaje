'use server';

import { prisma } from '@repo/db';
import { requireSuperAdminRole } from '@/lib/auth-check';

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  search?: string;
}

/**
 * Obtiene la bitácora de auditoría forense (AdminAuditLog) con paginación, filtros y telemetría.
 * Exclusivo para el rol SUPERADMIN.
 */
export async function getAuditLogsAction(params: GetAuditLogsParams = {}) {
  try {
    await requireSuperAdminRole();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(10, params.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.action && params.action !== 'ALL') {
      where.action = params.action;
    }

    if (params.entity && params.entity !== 'ALL') {
      where.entity = params.entity;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entity: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, logs, actionCounts] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      // Estadísticas rápidas por tipo de evento
      prisma.adminAuditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 8,
      }),
    ]);

    return {
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      actionCounts: actionCounts.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
    };
  } catch (error: any) {
    console.error('Error in getAuditLogsAction:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener la bitácora de logs.',
      logs: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      actionCounts: [],
    };
  }
}
