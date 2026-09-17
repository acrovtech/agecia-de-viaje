import { redirect } from 'next/navigation';
import { prisma, CouponItem } from '@repo/db';
import { requireAnyRole } from '@/lib/auth-check';
import { CuponesClient } from './cupones-client';

export const dynamic = 'force-dynamic';

export default async function CuponesPage() {
  // Exclusivo para Master, SuperAdmin y Marketing
  try {
    await requireAnyRole(['MASTER', 'MARKETING']);
  } catch {
    redirect('/');
  }

  let coupons: CouponItem[] = [];

  try {
    const dbCoupons = await (prisma as any).coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          where: {
            status: 'PAID',
          },
          select: {
            totalPrice: true,
          },
        },
      },
    });

    coupons = dbCoupons.map((c: any) => {
      const paidReservations = c.reservations || [];
      const totalRevenue = paidReservations.reduce((sum: number, res: any) => sum + (Number(res.totalPrice) || 0), 0);
      const budget = Number(c.budget) || 0;
      const roas = budget > 0 ? Number((totalRevenue / budget).toFixed(2)) : null;

      return {
        id: c.id,
        code: c.code,
        name: c.name || null,
        channel: c.channel || 'META_ADS',
        description: c.description || null,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minSpend: c.minSpend || 0,
        maxDiscount: c.maxDiscount || null,
        startDate: c.startDate ? c.startDate.toISOString() : null,
        endDate: c.endDate ? c.endDate.toISOString() : null,
        budget,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        usageLimit: c.usageLimit || null,
        timesUsed: c.timesUsed || 0,
        isActive: c.isActive,
        createdBy: c.createdBy || null,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
        totalRevenue,
        roas,
      };
    });
  } catch (error) {
    console.error('Error al obtener cupones en CuponesPage:', error);
  }

  return <CuponesClient initialCoupons={coupons} />;
}
