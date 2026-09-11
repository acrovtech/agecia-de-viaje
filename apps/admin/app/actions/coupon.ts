'use server';

import { revalidatePath } from 'next/cache';
import { prisma, handlePrismaError, SharedCreateCouponSchema, SharedUpdateCouponSchema, CouponItem } from '@repo/db';
import { requireAnyRole } from '@/lib/auth-check';

/**
 * Obtiene la lista de cupones registrados junto con sus métricas comerciales.
 * Acceso restringido a Master, Superadmin y Marketing.
 */
/**
 * Obtiene la lista de cupones y campañas registrados junto con métricas de ingresos reales y ROAS.
 * Acceso restringido a Master, Superadmin y Marketing.
 */
export async function getCouponsAction() {
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);

    const coupons = await (prisma as any).coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          where: {
            status: { in: ['PAID', 'PENDING'] },
          },
          select: {
            totalPrice: true,
            status: true,
          },
        },
      },
    });

    const mappedCoupons: CouponItem[] = coupons.map((c: any) => {
      // Dinero real generado por reservas pagadas
      const paidReservations = c.reservations?.filter((r: any) => r.status === 'PAID') || [];
      const totalRevenue = paidReservations.reduce((sum: number, res: any) => sum + (Number(res.totalPrice) || 0), 0);
      const budget = Number(c.budget) || 0;
      const roas = budget > 0 ? Number((totalRevenue / budget).toFixed(2)) : null;

      return {
        id: c.id,
        code: c.code,
        name: c.name || null,
        channel: c.channel || 'META_ADS',
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minSpend: c.minSpend,
        maxDiscount: c.maxDiscount,
        startDate: c.startDate ? c.startDate.toISOString() : null,
        endDate: c.endDate ? c.endDate.toISOString() : null,
        budget: c.budget ?? 0,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        usageLimit: c.usageLimit,
        timesUsed: c.timesUsed,
        isActive: c.isActive,
        createdBy: c.createdBy,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        totalRevenue,
        roas,
      };
    });

    return { success: true, coupons: mappedCoupons };
  } catch (error: any) {
    console.error('Error in getCouponsAction:', error);
    return { success: false, error: error.message || 'Error al obtener cupones' };
  }
}

/**
 * Registra una nueva campaña / cupón con canal, vigencia publicitaria y presupuesto.
 */
export async function createCouponAction(rawData: unknown) {
  try {
    const session = await requireAnyRole(['MASTER', 'MARKETING']);
    const parsed = SharedCreateCouponSchema.safeParse(rawData);

    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message || 'Datos de campaña/cupón inválidos' 
      };
    }

    const d = parsed.data;
    const cleanCode = d.code.trim().toUpperCase();

    // Validar duplicidad
    const existing = await (prisma as any).coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return { success: false, error: `El código "${cleanCode}" ya existe en el sistema.` };
    }

    const newCoupon = await (prisma as any).coupon.create({
      data: {
        code: cleanCode,
        name: d.name?.trim() || null,
        channel: d.channel || 'META_ADS',
        description: d.description?.trim() || null,
        discountType: d.discountType,
        discountValue: d.discountValue,
        minSpend: d.minSpend ?? 0,
        maxDiscount: d.maxDiscount ?? null,
        startDate: d.startDate ? new Date(d.startDate) : null,
        endDate: d.endDate ? new Date(d.endDate) : null,
        budget: d.budget ?? 0,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        usageLimit: d.usageLimit ?? null,
        isActive: d.isActive ?? true,
        createdBy: session.email || 'marketing',
      },
    });

    revalidatePath('/cupones');
    revalidatePath('/marketing');
    return { success: true, coupon: newCoupon };
  } catch (error: any) {
    console.error('Error in createCouponAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Actualiza los parámetros de una campaña / cupón existente.
 */
export async function updateCouponAction(rawData: unknown) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);
    const parsed = SharedUpdateCouponSchema.safeParse(rawData);

    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message || 'Datos del cupón inválidos' 
      };
    }

    const { id, ...data } = parsed.data;

    const updatePayload: Record<string, any> = {};
    if (data.code) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name?.trim() || null;
    if (data.channel) updatePayload.channel = data.channel;
    if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
    if (data.discountType) updatePayload.discountType = data.discountType;
    if (data.discountValue !== undefined) updatePayload.discountValue = data.discountValue;
    if (data.minSpend !== undefined) updatePayload.minSpend = data.minSpend ?? 0;
    if (data.maxDiscount !== undefined) updatePayload.maxDiscount = data.maxDiscount;
    if (data.startDate !== undefined) {
      updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updatePayload.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.budget !== undefined) updatePayload.budget = data.budget ?? 0;
    if (data.expiresAt !== undefined) {
      updatePayload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.usageLimit !== undefined) updatePayload.usageLimit = data.usageLimit;
    if (typeof data.isActive === 'boolean') updatePayload.isActive = data.isActive;

    const updated = await (prisma as any).coupon.update({
      where: { id },
      data: updatePayload,
    });

    revalidatePath('/cupones');
    revalidatePath('/marketing');
    return { success: true, coupon: updated };
  } catch (error: any) {
    console.error('Error in updateCouponAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Consulta analítica avanzada para reporte de temporadas y canales publicitarios.
 * Permite filtrar por fechas y agrupar para evaluar la campaña ganadora.
 */
export async function getCampaignPerformanceReportAction(filterStartDate?: string, filterEndDate?: string) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);

    const whereClause: any = {};
    if (filterStartDate) {
      whereClause.startDate = { gte: new Date(filterStartDate) };
    }
    if (filterEndDate) {
      whereClause.endDate = { lte: new Date(filterEndDate) };
    }

    const campaigns = await (prisma as any).coupon.findMany({
      where: whereClause,
      include: {
        reservations: {
          where: {
            status: 'PAID',
          },
          select: {
            totalPrice: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        timesUsed: 'desc',
      },
    });

    const report = campaigns.map((camp: any) => {
      const totalRevenue = camp.reservations.reduce((sum: number, res: any) => sum + (Number(res.totalPrice) || 0), 0);
      const budget = Number(camp.budget) || 0;
      const roas = budget > 0 ? Number((totalRevenue / budget).toFixed(2)) : null;

      return {
        id: camp.id,
        campaña: camp.name || camp.code,
        cupon: camp.code,
        canal: camp.channel || 'META_ADS',
        startDate: camp.startDate ? camp.startDate.toISOString().split('T')[0] : null,
        endDate: camp.endDate ? camp.endDate.toISOString().split('T')[0] : null,
        fechas: camp.startDate && camp.endDate 
          ? `${camp.startDate.toISOString().split('T')[0]} al ${camp.endDate.toISOString().split('T')[0]}`
          : 'Permanente / Sin fecha fija',
        totalReservas: camp.timesUsed,
        dineroGenerado: totalRevenue,
        presupuesto: budget,
        roas,
      };
    });

    return { success: true, report };
  } catch (error: any) {
    console.error('Error in getCampaignPerformanceReportAction:', error);
    return { success: false, error: error.message || 'Error al generar reporte de campañas' };
  }
}

/**
 * Alterna el estado activo/pausado de un cupón con 1 clic.
 */
export async function toggleCouponStatusAction(id: string) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);
    if (!id) return { success: false, error: 'ID de cupón requerido' };

    const current = await (prisma as any).coupon.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!current) {
      return { success: false, error: 'Cupón no encontrado' };
    }

    const updated = await (prisma as any).coupon.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    revalidatePath('/cupones');
    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    console.error('Error in toggleCouponStatusAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Elimina un cupón si no tiene reservas vinculadas.
 */
export async function deleteCouponAction(id: string) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);
    if (!id) return { success: false, error: 'ID de cupón requerido' };

    const reservationsCount = await prisma.reservation.count({
      where: { couponId: id } as any,
    });

    if (reservationsCount > 0) {
      // Si tiene reservas asociadas, lo desactivamos para preservar la trazabilidad contable
      await (prisma as any).coupon.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath('/cupones');
      return { 
        success: true, 
        message: 'El cupón tiene reservas vinculadas; ha sido desactivado permanentemente para proteger el historial contable.' 
      };
    }

    await (prisma as any).coupon.delete({
      where: { id },
    });

    revalidatePath('/cupones');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteCouponAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}
