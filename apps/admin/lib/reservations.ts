import { z } from 'zod';

export const canOperateReservations = (role: string) => ['OWNER', 'ADMIN', 'OPERATOR'].includes(role);
export const operationLabels: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Completada' };
export const quoteSchema = z.object({
  kind: z.enum(['TOUR', 'TRANSFER']), serviceId: z.string(), modality: z.enum(['shared', 'private']), date: z.string(), pax: z.number().int(), vehicleId: z.string().nullable(),
  title: z.string(), vehicleName: z.string().nullable(), pricingUnit: z.enum(['PER_TRAVELER', 'GROUP']), unitPriceMinor: z.number().int(), totalMinor: z.number().int(), currency: z.literal('USD'), quoteHash: z.string(),
});
export type ReservationQuote = z.infer<typeof quoteSchema>;
export const reservationSummarySchema = z.object({
  id: z.string(), code: z.string().nullable(), operationStatus: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).nullable(), bookingStatus: z.string(), paymentStatus: z.string(), source: z.string().nullable(),
  serviceTitle: z.string().nullable(), date: z.string(), pax: z.number(), currency: z.string(), totalMinor: z.number().nullable(), totalPrice: z.number(),
  customerFirstName: z.string(), customerLastName: z.string(), updatedAt: z.string(), createdAt: z.string(),
});
export const reservationDetailSchema = reservationSummarySchema.extend({
  serviceType: z.string().nullable(), unitPriceMinor: z.number().nullable(), pricingUnit: z.string().nullable(), vehicleName: z.string().nullable(),
  customerEmail: z.string(), customerPhone: z.string(), pickupHotel: z.string().nullable(), pickupTime: z.string().nullable(), specialRequirements: z.string().nullable(),
  passengers: z.array(z.object({ firstName: z.string(), lastName: z.string(), docType: z.string(), docNumber: z.string() })),
  events: z.array(z.object({ id: z.string(), actorLabel: z.string(), fromStatus: z.string().nullable(), toStatus: z.string(), note: z.string(), createdAt: z.string() })),
});
export type ReservationDetail = z.infer<typeof reservationDetailSchema>;
export const priceLabel = (minor: number, currency = 'USD') => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(minor / 100);
