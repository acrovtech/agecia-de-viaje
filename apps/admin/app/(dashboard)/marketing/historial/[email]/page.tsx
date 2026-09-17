import { notFound, redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import { requireAnyRole } from '@/lib/auth-check';
import { HistorialDetailClient } from './historial-detail-client';

export const dynamic = 'force-dynamic';

export default async function CustomerHistorialPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  try {
    await requireAnyRole(['MASTER', 'MARKETING', 'CONTENT_CREATOR']);
  } catch {
    redirect('/');
  }

  const { email } = await params;
  const decodedEmail = decodeURIComponent(email).toLowerCase().trim();

  let reservations: any[] = [];
  let campaignLogs: any[] = [];
  let coupons: any[] = [];

  try {
    const [dbReservations, dbLogs, dbCoupons] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          customerEmail: {
            equals: decodedEmail,
            mode: 'insensitive',
          },
        },
        include: {
          tour: { select: { title: true, slug: true } },
          transfer: { select: { title: true, slug: true } },
          vehicleType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).marketingCampaignLog.findMany({
        where: {
          customerEmail: {
            equals: decodedEmail,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).coupon.findMany({
        where: { isActive: true },
        select: { id: true, code: true, discountType: true, discountValue: true, description: true },
        orderBy: { code: 'asc' },
      }),
    ]);

    reservations = dbReservations;
    campaignLogs = dbLogs;
    coupons = dbCoupons;
  } catch (error) {
    console.error('Error al cargar historial del cliente:', error);
  }

  // Si no hay ni reservas ni logs, verificar si el email es válido
  if (reservations.length === 0 && campaignLogs.length === 0) {
    // Si viene de un link de marketing, permitimos ver ficha vacía/prospecto
  }

  const customerName =
    reservations[0]?.customerFirstName || reservations[0]?.customerLastName
      ? `${reservations[0]?.customerFirstName || ''} ${reservations[0]?.customerLastName || ''}`.trim()
      : 'Cliente';

  const customerPhone = reservations.find((r) => r.customerPhone)?.customerPhone || null;

  const totalSpent = reservations.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
  const attributedCodes = Array.from(
    new Set(reservations.map((r) => r.marketingCode).filter(Boolean))
  ) as string[];

  const contactData = {
    email: decodedEmail,
    fullName: customerName,
    phone: customerPhone,
    totalSpent,
    reservationsCount: reservations.length,
    hasAttributedBooking: attributedCodes.length > 0,
    attributedCodes,
    reservations: reservations.map((r) => ({
      id: r.id,
      code: r.code || null,
      title: r.tour?.title || r.transfer?.title || 'Reserva Turística',
      type: (r.tour ? 'TOUR' : 'TRANSFER') as 'TOUR' | 'TRANSFER',
      date: new Date(r.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      pax: r.pax,
      totalPrice: Number(r.totalPrice) || 0,
      status: r.status,
      pickupHotel: r.pickupHotel || null,
      marketingCode: r.marketingCode || null,
      source: r.source || 'WEB',
      createdAt: new Date(r.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
    })),
    campaignsSent: campaignLogs.map((log) => ({
      id: log.id,
      campaignCode: log.campaignCode,
      subject: log.subject,
      message: log.message,
      flyerUrl: log.flyerUrl || null,
      whatsappUrl: log.whatsappUrl || null,
      createdAt: new Date(log.createdAt).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })),
  };

  return <HistorialDetailClient contact={contactData} availableCoupons={coupons} />;
}
