import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface CurrencyFinancials {
  grossBookedValue: number;
  actualCollectedValue: number;
  refundedValue: number;
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  grossBookedValue: number;
  actualCollectedValue: number;
  refundedValue: number;
  currency: string;
  totalsByCurrency: Record<string, CurrencyFinancials>;
  paymentStatusBreakdown: Record<string, { count: number; totalsByCurrency: Record<string, number> }>;
  bookingStatusBreakdown: Record<string, number>;
  reservationsByDay: { date: string; count: number; totalsByCurrency: Record<string, number> }[];
  topTours: { title: string; count: number }[];
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
        bookingStatus: true,
        paymentStatus: true,
        source: true,
        totalPrice: true,
        totalMinor: true,
        paidMinor: true,
        refundedMinor: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalActive = 0;
    let totalCancelled = 0;

    const totalsByCurrency: Record<string, CurrencyFinancials> = {};
    const paymentStatusBreakdown: Record<string, { count: number; totalsByCurrency: Record<string, number> }> = {};
    const bookingStatusBreakdown: Record<string, number> = {};
    const dayMap = new Map<string, { count: number; totalsByCurrency: Record<string, number> }>();
    const tourMap = new Map<string, number>();
    const sourceBreakdown: Record<string, number> = {};

    for (const r of reservations) {
      const currency = r.currency || 'USD';
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = {
          grossBookedValue: 0,
          actualCollectedValue: 0,
          refundedValue: 0,
          totalReservations: 0,
          activeReservations: 0,
          cancelledReservations: 0,
        };
      }

      totalsByCurrency[currency].totalReservations += 1;

      const isCancelled = r.bookingStatus === 'CANCELLED' || r.status === 'CANCELLED';
      const price = typeof r.totalMinor === 'number' && !isNaN(r.totalMinor)
        ? r.totalMinor / 100
        : (typeof r.totalPrice === 'number' ? r.totalPrice : 0);

      const paid = typeof r.paidMinor === 'number' && !isNaN(r.paidMinor) ? r.paidMinor / 100 : 0;
      const refunded = typeof r.refundedMinor === 'number' && !isNaN(r.refundedMinor) ? r.refundedMinor / 100 : 0;
      const collected = Math.max(0, paid - refunded);

      // Cash truth: actualCollectedValue and refundedValue follow real cash movements for all reservations
      totalsByCurrency[currency].actualCollectedValue = Math.round((totalsByCurrency[currency].actualCollectedValue + collected) * 100) / 100;
      totalsByCurrency[currency].refundedValue = Math.round((totalsByCurrency[currency].refundedValue + refunded) * 100) / 100;

      if (isCancelled) {
        totalCancelled += 1;
        totalsByCurrency[currency].cancelledReservations += 1;
      } else {
        totalActive += 1;
        totalsByCurrency[currency].activeReservations += 1;
        totalsByCurrency[currency].grossBookedValue = Math.round((totalsByCurrency[currency].grossBookedValue + price) * 100) / 100;

        // By Day (active reservations with isolated currency totals)
        const dateStr = r.createdAt.toISOString().slice(0, 10);
        let dayData = dayMap.get(dateStr);
        if (!dayData) {
          dayData = { count: 0, totalsByCurrency: {} };
          dayMap.set(dateStr, dayData);
        }
        dayData.count += 1;
        dayData.totalsByCurrency[currency] = Math.round(((dayData.totalsByCurrency[currency] || 0) + price) * 100) / 100;

        // Top Tours: rank only by reservation count (Option B)
        const tourTitle = r.serviceTitle || 'Servicio sin título';
        tourMap.set(tourTitle, (tourMap.get(tourTitle) || 0) + 1);
      }

      // Payment status (authoritative enum with isolated currency totals)
      const pStatus = r.paymentStatus || 'PENDING';
      if (!paymentStatusBreakdown[pStatus]) {
        paymentStatusBreakdown[pStatus] = { count: 0, totalsByCurrency: {} };
      }
      paymentStatusBreakdown[pStatus].count += 1;
      paymentStatusBreakdown[pStatus].totalsByCurrency[currency] =
        Math.round(((paymentStatusBreakdown[pStatus].totalsByCurrency[currency] || 0) + price) * 100) / 100;

      // Booking status
      const bStatus = r.bookingStatus || r.status || 'PENDING';
      bookingStatusBreakdown[bStatus] = (bookingStatusBreakdown[bStatus] || 0) + 1;

      // Source / Channel
      const source = r.source || 'DIRECT';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    }

    const reservationsByDay = Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, count: data.count, totalsByCurrency: data.totalsByCurrency }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topTours = Array.from(tourMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Primary currency (USD if present, or first available currency, or 'USD')
    const primaryCurrency = totalsByCurrency['USD']
      ? 'USD'
      : Object.keys(totalsByCurrency)[0] || 'USD';
    const primaryFinancials = totalsByCurrency[primaryCurrency] || {
      grossBookedValue: 0,
      actualCollectedValue: 0,
      refundedValue: 0,
      totalReservations: 0,
      activeReservations: 0,
      cancelledReservations: 0,
    };

    return {
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      totalReservations: reservations.length,
      activeReservations: totalActive,
      cancelledReservations: totalCancelled,
      grossBookedValue: primaryFinancials.grossBookedValue,
      actualCollectedValue: primaryFinancials.actualCollectedValue,
      refundedValue: primaryFinancials.refundedValue,
      currency: primaryCurrency,
      totalsByCurrency,
      paymentStatusBreakdown,
      bookingStatusBreakdown,
      reservationsByDay,
      topTours,
      sourceBreakdown,
    };
  }
}
