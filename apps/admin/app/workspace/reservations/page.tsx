import Link from 'next/link';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { isApiAdmin } from '../../../lib/admin-mode';
import { canOperateReservations, operationLabels, priceLabel, reservationSummarySchema, reservationDetailSchema } from '../../../lib/reservations';
import { tourContentSchema, transferContentSchema } from '../../../lib/catalog-content';
import { BookingForm, StatusForm } from './forms';

export const dynamic = 'force-dynamic';
const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const catalogSchema = z.object({ data: z.array(z.object({ id: z.string(), title: z.string(), isPublished: z.boolean(), isActive: z.boolean().optional() })), nextCursor: z.string().nullable() });
const paymentLabels: Record<string, string> = { PENDING: 'Pendiente', PARTIALLY_PAID: 'Pago parcial', PAID: 'Pagada', REFUND_PENDING: 'Reembolso pendiente', PARTIALLY_REFUNDED: 'Reembolso parcial', REFUNDED: 'Reembolsada', PAYMENT_RECEIVED_REVIEW: 'Pago en revisión', FAILED: 'Fallido', EXPIRED: 'Expirado', LEGACY_UNKNOWN: 'Estado anterior sin verificar' };

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isApiAdmin()) redirect('/');
  const params = await searchParams;
  let content;
  try {
    const { token, identity } = await centralSession();
    if (!canOperateReservations(identity.role)) return <main className="p-8">Tu rol no permite consultar reservas. <Link href="/workspace" className="underline">Volver</Link></main>;
    const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;
    if (params.id !== undefined) {
      if (!validId(params.id)) throw new CentralApiError(404);
      const row = reservationDetailSchema.parse(await centralRequest(`${base}/reservations/${params.id}`, token));
      content = <>
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="text-xl font-semibold">{row.code ?? row.id}</h2><p>{row.serviceTitle ?? 'Reserva anterior'} · {row.date.slice(0, 10)} · {row.pax} pasajeros</p><p>Estado operativo: <strong>{row.operationStatus ? operationLabels[row.operationStatus] : 'Reserva anterior: solo consulta'}</strong></p><p>Pago: {paymentLabels[row.paymentStatus] ?? row.paymentStatus}</p><p className="font-semibold">Total acordado: {priceLabel(row.totalMinor ?? Math.round(row.totalPrice * 100), row.currency)}</p>{row.unitPriceMinor !== null && <p>Tarifa guardada: {priceLabel(row.unitPriceMinor, row.currency)} {row.pricingUnit === 'GROUP' ? 'por vehículo' : 'por persona'}</p>}{row.vehicleName && <p>Vehículo: {row.vehicleName}</p>}<p>{row.customerFirstName} {row.customerLastName} · {row.customerEmail} · {row.customerPhone}</p>{row.pickupHotel && <p>Recojo: {row.pickupHotel} {row.pickupTime}</p>}{row.specialRequirements && <p className="whitespace-pre-wrap">Observaciones: {row.specialRequirements}</p>}</section>
        <section className="bg-white border rounded-xl p-5 space-y-2"><h2 className="font-semibold text-lg">Pasajeros</h2>{row.passengers.map((p, i) => <p key={i}>{i + 1}. {p.firstName} {p.lastName}{p.docNumber ? ` · ${p.docType}: ${p.docNumber}` : ''}</p>)}{!row.passengers.length && <p>Sin pasajeros registrados.</p>}</section>
        <StatusForm key={row.updatedAt} reservation={row} />
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-semibold text-lg">Historial operativo</h2>{!row.events.length && <p>Esta reserva anterior no tiene historial en el nuevo módulo.</p>}{row.events.map((event) => <article key={event.id} className="border-b pb-3"><p>{event.fromStatus ? `${operationLabels[event.fromStatus]} → ` : ''}{operationLabels[event.toStatus]} · {new Date(event.createdAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p><p className="text-sm text-slate-600">{event.actorLabel}</p><p className="whitespace-pre-wrap">{event.note}</p></article>)}</section>
      </>;
    } else if (params.new === '1') {
      const kind = params.kind === 'transfers' ? 'transfers' : 'tours';
      if (params.serviceId !== undefined) {
        if (!validId(params.serviceId)) throw new CentralApiError(404);
        const body = await centralRequest(`${base}/catalog/${kind}/${params.serviceId}/content`, token);
        const row = kind === 'tours' ? tourContentSchema.parse(body) : transferContentSchema.parse(body);
        if (!row.isPublished || ('isActive' in row && !row.isActive)) throw new CentralApiError(404);
        const vehicles = 'vehiclePrices' in row ? row.vehiclePrices.filter((p) => p.vehicle.isActive).map((p) => ({ id: p.vehicleId, name: p.vehicle.name, maxPax: p.vehicle.maxPax })) : [];
        content = <><Link href={`/workspace/reservations?new=1&kind=${kind}`} className="underline">Elegir otro servicio</Link><BookingForm key={row.id} requestKey={randomUUID()} service={{ id: row.id, title: row.title, kind: kind === 'tours' ? 'TOUR' : 'TRANSFER', hasSharedService: row.hasSharedService, hasPrivateService: row.hasPrivateService, vehicles }} /></>;
      } else {
        const after = validId(params.after) ? `?after=${encodeURIComponent(params.after)}` : '';
        const list = catalogSchema.parse(await centralRequest(`${base}/catalog/${kind}${after}`, token));
        const rows = list.data.filter((r) => r.isPublished && (kind === 'tours' || r.isActive));
        content = <section className="bg-white border rounded-xl p-5 space-y-4"><h2 className="text-xl font-semibold">Elegir servicio publicado</h2><nav className="flex gap-5"><Link className="underline" href="/workspace/reservations?new=1&kind=tours">Tours</Link><Link className="underline" href="/workspace/reservations?new=1&kind=transfers">Traslados</Link></nav><p>Solo se reservan servicios publicados. Publica los borradores desde el catálogo antes de usarlos.</p>{rows.map((r) => <Link className="block border rounded-lg p-3 underline" key={r.id} href={`/workspace/reservations?new=1&kind=${kind}&serviceId=${r.id}`}>{r.title}</Link>)}{!rows.length && <p>No hay servicios publicados en esta página.</p>}{list.nextCursor && <Link className="underline" href={`/workspace/reservations?new=1&kind=${kind}&after=${list.nextCursor}`}>Siguiente página</Link>}</section>;
      }
    } else {
      const query = new URLSearchParams();
      if (validId(params.after)) query.set('after', params.after);
      if (typeof params.status === 'string' && Object.hasOwn(operationLabels, params.status)) query.set('status', params.status);
      const list = z.object({ data: z.array(reservationSummarySchema), nextCursor: z.string().nullable() }).parse(await centralRequest(`${base}/reservations?${query}`, token));
      const next = new URLSearchParams(query); if (list.nextCursor) next.set('after', list.nextCursor);
      content = <section className="bg-white border rounded-xl p-5 space-y-4"><Link className="inline-block rounded-lg bg-[#062918] text-white px-4 py-2" href="/workspace/reservations?new=1">Crear reserva manual</Link><nav aria-label="Filtrar por estado" className="flex flex-wrap gap-4 text-sm"><Link className="underline" href="/workspace/reservations">Todas</Link>{Object.entries(operationLabels).map(([status, label]) => <Link key={status} className="underline" href={`/workspace/reservations?status=${status}`}>{label}</Link>)}</nav><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="py-3">Reserva</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>{list.data.map((row) => <tr key={row.id} className="border-t"><td className="py-4 pr-3"><Link className="underline" href={`/workspace/reservations?id=${row.id}`}>{row.code ?? row.id}</Link><p>{row.serviceTitle ?? 'Reserva anterior'}</p></td><td>{row.customerFirstName} {row.customerLastName}</td><td>{row.date.slice(0, 10)}</td><td>{row.operationStatus ? operationLabels[row.operationStatus] : 'Solo consulta'}</td><td>{priceLabel(row.totalMinor ?? Math.round(row.totalPrice * 100), row.currency)}</td></tr>)}</tbody></table></div>{!list.data.length && <p>No hay reservas para este filtro.</p>}<div className="flex gap-4">{params.after && <Link className="underline" href={`/workspace/reservations${params.status ? `?status=${encodeURIComponent(String(params.status))}` : ''}`}>Primera página</Link>}{list.nextCursor && <Link className="underline" href={`/workspace/reservations?${next}`}>Siguiente página</Link>}</div></section>;
    }
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) redirect('/login?expired=1');
    content = <p role="alert" className="text-red-700">No pudimos cargar la reserva o el servicio. Comprueba que esté disponible en tu agencia y vuelve a intentar.</p>;
  }
  return <main className="max-w-5xl mx-auto p-5 md:p-8 space-y-6"><nav className="flex gap-5"><Link className="underline" href="/workspace">Catálogo y equipo</Link><Link className="underline" href="/workspace/reservations">Reservas</Link></nav><h1 className="text-3xl font-semibold text-[#062918]">Reservas de tu agencia</h1>{params.saved === '1' && <p role="status" className="bg-green-50 text-green-800 p-3 rounded-lg">Reserva guardada.</p>}{content}</main>;
}
