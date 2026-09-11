import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import { requireAnyRole } from '@/lib/auth-check';
import { MarketingClient, MarketingContact } from './marketing-client';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  // Master, Marketing y Content Creator tienen acceso al módulo comercial
  try {
    await requireAnyRole(['MASTER', 'MARKETING', 'CONTENT_CREATOR']);
  } catch {
    redirect('/');
  }

  let reservations: any[] = [];
  let campaignLogs: any[] = [];
  let coupons: any[] = [];

  try {
    const [dbReservations, dbLogs, dbCoupons] = await Promise.all([
      prisma.reservation.findMany({
        include: {
          tour: { select: { title: true, slug: true } },
          transfer: { select: { title: true, slug: true } },
          vehicleType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).marketingCampaignLog.findMany({
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
    console.error('Error al obtener datos para marketing:', error);
  }

  // Agrupar por correo de cliente único
  const contactsMap = new Map<string, MarketingContact>();

  // 1. Mapear reservas a clientes
  for (const r of reservations) {
    const email = r.customerEmail?.toLowerCase().trim();
    if (!email) continue;

    const title = r.tour?.title || r.transfer?.title || 'Reserva Turística';
    const type = r.tour ? 'TOUR' : 'TRANSFER';

    const bookingItem = {
      id: r.id,
      code: r.code || null,
      title,
      type: type as 'TOUR' | 'TRANSFER',
      date: new Date(r.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      pax: r.pax,
      totalPrice: Number(r.totalPrice) || 0,
      status: r.status,
      pickupHotel: r.pickupHotel || null,
      marketingCode: r.marketingCode || null,
      source: r.source || 'WEB',
      createdAt: new Date(r.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    const existing = contactsMap.get(email);
    if (existing) {
      existing.reservationsCount += 1;
      existing.totalSpent += Number(r.totalPrice) || 0;
      if (!existing.phone && r.customerPhone) {
        existing.phone = r.customerPhone;
      }
      existing.reservations.push(bookingItem);
      if (r.marketingCode && !existing.attributedCodes.includes(r.marketingCode)) {
        existing.attributedCodes.push(r.marketingCode);
        existing.hasAttributedBooking = true;
      }
    } else {
      contactsMap.set(email, {
        email,
        fullName: `${r.customerFirstName || ''} ${r.customerLastName || ''}`.trim() || 'Cliente Web',
        phone: r.customerPhone || null,
        reservationsCount: 1,
        totalSpent: Number(r.totalPrice) || 0,
        lastReservationDate: new Date(r.date || r.createdAt).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        lastStatus: r.status,
        preferredService: type === 'TOUR' ? 'Tours Turísticos' : 'Traslados Privados',
        hasAttributedBooking: Boolean(r.marketingCode),
        attributedCodes: r.marketingCode ? [r.marketingCode] : [],
        campaignsSent: [],
        reservations: [bookingItem],
      });
    }
  }

  // 2. Asociar logs de campañas de correo a cada cliente
  for (const log of campaignLogs) {
    const email = log.customerEmail?.toLowerCase().trim();
    if (!email) continue;

    const contact = contactsMap.get(email);
    const logItem = {
      id: log.id,
      campaignCode: log.campaignCode,
      subject: log.subject,
      message: log.message,
      flyerUrl: log.flyerUrl || null,
      whatsappUrl: log.whatsappUrl || null,
      createdAt: new Date(log.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    if (contact) {
      contact.campaignsSent.push(logItem);
    } else {
      // Si se envió un correo a un prospecto que aún no tiene reserva
      contactsMap.set(email, {
        email,
        fullName: 'Lead / Prospecto de Campaña',
        phone: null,
        reservationsCount: 0,
        totalSpent: 0,
        lastReservationDate: 'Sin reservas aún',
        lastStatus: 'PROSPECT',
        preferredService: 'Interés en Promociones',
        hasAttributedBooking: false,
        attributedCodes: [],
        campaignsSent: [logItem],
        reservations: [],
      });
    }
  }

  // 3. Determinar preferencia predominante en base al historial
  for (const contact of contactsMap.values()) {
    const toursCount = contact.reservations.filter((r) => r.type === 'TOUR').length;
    const transfersCount = contact.reservations.filter((r) => r.type === 'TRANSFER').length;
    if (toursCount > transfersCount) {
      contact.preferredService = 'Tours y Excursiones';
    } else if (transfersCount > toursCount) {
      contact.preferredService = 'Traslados al Aeropuerto';
    } else if (toursCount > 0) {
      contact.preferredService = 'Tours & Traslados Combinados';
    }
  }

  const contacts = Array.from(contactsMap.values());

  return <MarketingClient initialContacts={contacts} availableCoupons={coupons} />;
}
