import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import { requireAnyRole } from '@/lib/auth-check';
import { MarketingClient, MarketingContact } from './marketing-client';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  // Solo Master y Equipo de Marketing (CONTENT_CREATOR) tienen acceso
  try {
    await requireAnyRole(['MASTER', 'CONTENT_CREATOR']);
  } catch {
    redirect('/');
  }

  let reservations: any[] = [];
  try {
    reservations = await prisma.reservation.findMany({
      select: {
        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        customerPhone: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        date: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error al obtener reservas para marketing:', error);
  }

  // Agrupar por correo de cliente único
  const contactsMap = new Map<string, MarketingContact>();

  for (const r of reservations) {
    const email = r.customerEmail?.toLowerCase().trim();
    if (!email) continue;

    const existing = contactsMap.get(email);
    if (existing) {
      existing.reservationsCount += 1;
      existing.totalSpent += Number(r.totalPrice) || 0;
      if (!existing.phone && r.customerPhone) {
        existing.phone = r.customerPhone;
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
      });
    }
  }

  const contacts = Array.from(contactsMap.values());

  return <MarketingClient initialContacts={contacts} />;
}
