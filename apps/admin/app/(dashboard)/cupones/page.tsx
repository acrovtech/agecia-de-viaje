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
      },
    });

    coupons = dbCoupons.map((c: any) => ({
      id: c.id,
      code: c.code,
      description: c.description || null,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minSpend: c.minSpend || 0,
      maxDiscount: c.maxDiscount || null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      usageLimit: c.usageLimit || null,
      timesUsed: c.timesUsed || 0,
      isActive: c.isActive,
      createdBy: c.createdBy || null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error al obtener cupones en CuponesPage:', error);
  }

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CuponesClient initialCoupons={coupons} />
    </div>
  );
}
