import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface DashboardReservationDto {
  id: string;
  code: string | null;
  serviceTitle: string | null;
  date: string;
  pax: number;
  totalPrice: number;
  totalMinor?: number | null;
  currency: string;
  bookingStatus?: string | null;
  paymentStatus?: string | null;
  operationStatus?: string | null;
  customerFirstName: string;
  customerLastName: string;
  pickupHotel?: string | null;
}

export interface DashboardData {
  reservationsToday: number;
  upcomingReservations: DashboardReservationDto[];
  attentionNeeded: {
    reservation: DashboardReservationDto;
    reason: string;
  }[];
  next7DaysLoad: {
    date: string;
    dayName: string;
    count: number;
  }[];
  bookedValueSummary: {
    totalMinor: number;
    formattedValue: string;
    currency: string;
    totalCount: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(agencyId: string): Promise<DashboardData> {
    const reservations = await this.prisma.reservation.findMany({
      where: { agencyId },
      select: {
        id: true,
        code: true,
        serviceTitle: true,
        date: true,
        pax: true,
        totalPrice: true,
        totalMinor: true,
        currency: true,
        bookingStatus: true,
        paymentStatus: true,
        operationStatus: true,
        customerFirstName: true,
        customerLastName: true,
        pickupHotel: true,
        status: true,
      },
      orderBy: { date: 'asc' },
    });

    // Consistent America/Lima timezone calculation
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

    const mappedReservations: DashboardReservationDto[] = reservations.map((r) => ({
      id: r.id,
      code: r.code,
      serviceTitle: r.serviceTitle,
      date: r.date.toISOString(),
      pax: r.pax,
      totalPrice: r.totalPrice,
      totalMinor: r.totalMinor,
      currency: r.currency,
      bookingStatus: r.bookingStatus,
      paymentStatus: r.paymentStatus,
      operationStatus: r.operationStatus,
      customerFirstName: r.customerFirstName,
      customerLastName: r.customerLastName,
      pickupHotel: r.pickupHotel,
    }));

    // Helper to get YYYY-MM-DD in America/Lima for a given Date
    const getLimaDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);

    // 1. Reservations Today (by service date)
    const reservationsToday = reservations.filter((r) => getLimaDate(r.date) === todayStr).length;

    // 2. Attention Needed: non-cancelled records requiring operational or financial action
    const attentionNeeded: { reservation: DashboardReservationDto; reason: string }[] = [];
    for (let i = 0; i < reservations.length; i++) {
      const r = reservations[i]!;
      const isCancelled = r.bookingStatus === 'CANCELLED' || r.status === 'CANCELLED';
      if (isCancelled) continue;

      const dto = mappedReservations[i]!;
      if (r.bookingStatus === 'PENDING') {
        attentionNeeded.push({ reservation: dto, reason: 'Reserva pendiente de confirmación' });
      } else if (r.paymentStatus === 'PENDING') {
        attentionNeeded.push({ reservation: dto, reason: 'Pago pendiente de cobro' });
      } else if (r.operationStatus === 'PENDING') {
        attentionNeeded.push({ reservation: dto, reason: 'Servicio en estado pendiente de coordinación' });
      }
    }

    // 3. Upcoming Reservations: strictly by service date >= today
    const upcomingFiltered = mappedReservations
      .filter((r, idx) => {
        const raw = reservations[idx]!;
        const isCancelled = raw.bookingStatus === 'CANCELLED' || raw.status === 'CANCELLED';
        return !isCancelled && getLimaDate(raw.date) >= todayStr;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // If none upcoming, show latest active reservations
    const displayedUpcoming = upcomingFiltered.length > 0
      ? upcomingFiltered.slice(0, 10)
      : mappedReservations
          .filter((_, idx) => {
            const raw = reservations[idx]!;
            return raw.bookingStatus !== 'CANCELLED' && raw.status !== 'CANCELLED';
          })
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10);

    // 4. Next 7 Days Load in America/Lima
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());

    const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
    const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

    const next7DaysLoad = Array.from({ length: 7 }, (_, i) => {
      const targetUtc = new Date(Date.UTC(year, month - 1, day + i));
      const targetDateStr = targetUtc.toISOString().slice(0, 10);
      const dayName = dayNames[targetUtc.getUTCDay()] || '';
      const count = reservations.filter((r) => {
        const isCancelled = r.bookingStatus === 'CANCELLED' || r.status === 'CANCELLED';
        return !isCancelled && getLimaDate(r.date) === targetDateStr;
      }).length;
      return { date: targetDateStr, dayName, count };
    });

    // 5. Booked value summary (non-cancelled only)
    const activeReservations = reservations.filter(
      (r) => r.bookingStatus !== 'CANCELLED' && r.status !== 'CANCELLED',
    );
    const bookedMinorTotal = activeReservations.reduce((acc, r) => {
      const minor = typeof r.totalMinor === 'number' && !isNaN(r.totalMinor)
        ? r.totalMinor
        : Math.round((r.totalPrice || 0) * 100);
      return acc + minor;
    }, 0);

    const currency = activeReservations[0]?.currency || 'USD';
    const formattedValue = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency,
    }).format(bookedMinorTotal / 100);

    return {
      reservationsToday,
      upcomingReservations: displayedUpcoming,
      attentionNeeded,
      next7DaysLoad,
      bookedValueSummary: {
        totalMinor: bookedMinorTotal,
        formattedValue,
        currency,
        totalCount: reservations.length,
      },
    };
  }
}
