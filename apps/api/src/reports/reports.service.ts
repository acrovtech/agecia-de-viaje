import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportSummary {
  period: ReportPeriod;
  totalReservations: number;
  grossBookedValue: number;
  currency: string;
  paymentStatusBreakdown: Record<string, { count: number; total: number }>;
  bookingStatusBreakdown: Record<string, number>;
  reservationsByDay: { date: string; count: number; total: number }[];
  topTours: { title: string; count: number; total: number }[];
  sourceBreakdown: Record<string, number>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(agencyId: string, from?: string, to?: string): Promise<ReportSummary> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (from) {
      startDate = new Date(from);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Parámetro "from" debe ser una fecha válida ISO o YYYY-MM-DD');
      }
    } else {
      // Default: First day of current month (UTC)
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    if (to) {
      endDate = new Date(to);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Parámetro "to" debe ser una fecha válida ISO o YYYY-MM-DD');
      }
      // If only date was provided (e.g. YYYY-MM-DD), set to end of that day
      if (to.length <= 10) {
        endDate.setUTCHours(23, 59, 59, 999);
      }
    } else {
      // Default: End of current month
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }

    if (startDate > endDate) {
      throw new BadRequestException('La fecha de inicio ("from") no puede ser posterior a la fecha final ("to")');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        agencyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        serviceTitle: true,
        status: true,
        paymentStatus: true,
        source: true,
        totalPrice: true,
        totalMinor: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let grossBookedValue = 0;
    const paymentStatusBreakdown: Record<string, { count: number; total: number }> = {};
    const bookingStatusBreakdown: Record<string, number> = {};
    const dayMap = new Map<string, { count: number; total: number }>();
    const tourMap = new Map<string, { count: number; total: number }>();
    const sourceBreakdown: Record<string, number> = {};

    for (const r of reservations) {
      const price = typeof r.totalMinor === 'number' && !isNaN(r.totalMinor)
        ? r.totalMinor / 100
        : (typeof r.totalPrice === 'number' ? r.totalPrice : 0);

      grossBookedValue += price;

      // Payment status
      const pStatus = r.paymentStatus || 'PENDING';
      if (!paymentStatusBreakdown[pStatus]) {
        paymentStatusBreakdown[pStatus] = { count: 0, total: 0 };
      }
      paymentStatusBreakdown[pStatus].count += 1;
      paymentStatusBreakdown[pStatus].total = Math.round((paymentStatusBreakdown[pStatus].total + price) * 100) / 100;

      // Booking status
      const bStatus = r.status || 'PENDING';
      bookingStatusBreakdown[bStatus] = (bookingStatusBreakdown[bStatus] || 0) + 1;

      // By Day
      const dateStr = r.createdAt.toISOString().slice(0, 10);
      const dayData = dayMap.get(dateStr) || { count: 0, total: 0 };
      dayData.count += 1;
      dayData.total = Math.round((dayData.total + price) * 100) / 100;
      dayMap.set(dateStr, dayData);

      // Top Tours
      const tourTitle = r.serviceTitle || 'Servicio sin título';
      const tourData = tourMap.get(tourTitle) || { count: 0, total: 0 };
      tourData.count += 1;
      tourData.total = Math.round((tourData.total + price) * 100) / 100;
      tourMap.set(tourTitle, tourData);

      // Source / Channel
      const source = r.source || 'DIRECT';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    }

    const reservationsByDay = Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, count: data.count, total: data.total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topTours = Array.from(tourMap.entries())
      .map(([title, data]) => ({ title, count: data.count, total: data.total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      totalReservations: reservations.length,
      grossBookedValue: Math.round(grossBookedValue * 100) / 100,
      currency: reservations[0]?.currency || 'USD',
      paymentStatusBreakdown,
      bookingStatusBreakdown,
      reservationsByDay,
      topTours,
      sourceBreakdown,
    };
  }
}
