'use client';

import { useActionState, useState } from 'react';
import { quoteReservationAction, createReservationAction, transitionReservationAction } from './actions';
import { operationLabels, priceLabel, type ReservationQuote, type ReservationDetail } from '../../../lib/reservations';

const inputClass = 'block w-full rounded-lg border p-2 mt-1 bg-white';
const buttonClass = 'rounded-lg bg-[#062918] px-4 py-2 text-white disabled:opacity-50';
export function BookingForm({ service, requestKey }: { requestKey: string; service: { id: string; title: string; kind: 'TOUR' | 'TRANSFER'; hasSharedService: boolean; hasPrivateService: boolean; vehicles: { id: string; name: string; maxPax: number }[] } }) {
  const [modality, setModality] = useState<'shared' | 'private'>(service.hasSharedService ? 'shared' : 'private');
  const [date, setDate] = useState('');
  const [pax, setPax] = useState(1);
  const [vehicleId, setVehicle] = useState('');
  const [state, action, pending] = useActionState(quoteReservationAction, null);
  const selection = { kind: service.kind, serviceId: service.id, modality, date, pax, vehicleId: service.kind === 'TRANSFER' && modality === 'private' ? vehicleId || null : null };
  const quote = state?.quote;
  const currentQuote = quote && quote.kind === selection.kind && quote.serviceId === selection.serviceId && quote.modality === modality && quote.date === date && quote.pax === pax && quote.vehicleId === selection.vehicleId ? quote : undefined;
  return <div className="space-y-6">
    <form action={action} className="space-y-4 border rounded-xl p-5 bg-white">
      <h2 className="text-xl font-semibold">1. Cotizar: {service.title}</h2>
      <input type="hidden" name="payload" value={JSON.stringify(selection)} />
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <label>Modalidad<select className={inputClass} value={modality} onChange={(e) => setModality(e.target.value as 'shared' | 'private')}>{service.hasSharedService && <option value="shared">Compartida</option>}{service.hasPrivateService && <option value="private">Privada</option>}</select></label>
        <label>Fecha del servicio (Perú)<input className={inputClass} type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Pasajeros<input className={inputClass} type="number" min={1} max={100} step={1} required value={pax} onChange={(e) => setPax(Number(e.target.value))} /></label>
        {service.kind === 'TRANSFER' && modality === 'private' && <label>Vehículo<select required className={inputClass} value={vehicleId} onChange={(e) => setVehicle(e.target.value)}><option value="">Seleccionar</option>{service.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · hasta {v.maxPax} pasajeros</option>)}</select></label>}
      </fieldset>
      {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
      <button disabled={pending} className={buttonClass}>{pending ? 'Calculando…' : 'Calcular precio'}</button>
      <p className="text-sm text-slate-600">La cotización verifica la tarifa vigente. La disponibilidad y coordinación del servicio se revisan manualmente antes de confirmar la reserva.</p>
    </form>
    {currentQuote && <CreateForm key={currentQuote.quoteHash} quote={currentQuote} requestKey={requestKey} />}
  </div>;
}
function CreateForm({ quote, requestKey }: { quote: ReservationQuote; requestKey: string }) {
  const [state, action, pending] = useActionState(createReservationAction, null);
  const [contact, setContact] = useState({ customerFirstName: '', customerLastName: '', customerEmail: '', customerPhone: '', pickupHotel: '', pickupTime: '', specialRequirements: '' });
  const [passengers, setPassengers] = useState(Array.from({ length: quote.pax }, () => ({ firstName: '', lastName: '', docType: 'DNI', docNumber: '' })));
  const { kind, serviceId, modality, date, pax, vehicleId } = quote;
  const payload = { selection: { kind, serviceId, modality, date, pax, vehicleId }, requestKey, quoteHash: quote.quoteHash, ...contact, passengers };
  return <form action={action} className="space-y-5 border rounded-xl p-5 bg-white">
    <h2 className="text-xl font-semibold">2. Revisar y crear reserva</h2>
    <div className="bg-green-50 p-4 rounded-lg"><p>{quote.title} · {date} · {pax} pasajeros · {modality === 'shared' ? 'Compartida' : 'Privada'}</p>{quote.vehicleName && <p>{quote.vehicleName}</p>}<p>{priceLabel(quote.unitPriceMinor)} {quote.pricingUnit === 'GROUP' ? 'por vehículo' : 'por persona'}</p><p className="text-xl font-semibold">Total: {priceLabel(quote.totalMinor)}</p></div>
    <input type="hidden" name="payload" value={JSON.stringify(payload)} />
    <fieldset disabled={pending} className="space-y-4">
      <legend className="font-semibold mb-3">Contacto del cliente</legend>
      <div className="grid gap-4 sm:grid-cols-2">{([
        ['customerFirstName', 'Nombres', 'text', true, 100], ['customerLastName', 'Apellidos', 'text', true, 100], ['customerEmail', 'Correo', 'email', true, 254], ['customerPhone', 'Teléfono', 'tel', true, 40], ['pickupHotel', 'Lugar de recojo (opcional)', 'text', false, 300], ['pickupTime', 'Hora local de recojo (opcional)', 'time', false, 5],
      ] as const).map(([key, label, type, required, maxLength]) => <label key={key}>{label}<input className={inputClass} required={required} maxLength={maxLength} type={type} value={contact[key]} onChange={(e) => setContact({ ...contact, [key]: e.target.value })} /></label>)}</div>
      <label className="block">Observaciones (opcional)<textarea className={inputClass} maxLength={2000} value={contact.specialRequirements} onChange={(e) => setContact({ ...contact, specialRequirements: e.target.value })} /></label>
      <h3 className="font-semibold">Pasajeros</h3><p className="text-sm">Los documentos son opcionales en esta etapa.</p>
      {passengers.map((p, index) => <fieldset key={index} className="border rounded-lg p-3 grid gap-3 sm:grid-cols-2"><legend>Pasajero {index + 1}</legend>{(['firstName', 'lastName', 'docNumber'] as const).map((key) => <label key={key}>{key === 'firstName' ? 'Nombres' : key === 'lastName' ? 'Apellidos' : 'Número de documento (opcional)'}<input className={inputClass} required={key !== 'docNumber'} maxLength={key === 'docNumber' ? 40 : 100} value={p[key]} onChange={(e) => setPassengers(passengers.map((row, i) => i === index ? { ...row, [key]: e.target.value } : row))} /></label>)}<label>Tipo de documento<select className={inputClass} value={p.docType} onChange={(e) => setPassengers(passengers.map((row, i) => i === index ? { ...row, docType: e.target.value } : row))}><option>DNI</option><option>PASAPORTE</option><option>CE</option></select></label></fieldset>)}
      <label className="flex gap-2"><input type="checkbox" required />Revisé servicio, fecha, pasajeros e importe. Crearé una reserva pendiente, sin registrar un pago.</label>
      {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
      <button className={buttonClass} disabled={pending}>{pending ? 'Guardando…' : 'Crear reserva pendiente'}</button>
    </fieldset>
  </form>;
}
export function StatusForm({ reservation }: { reservation: ReservationDetail }) {
  const [state, action, pending] = useActionState(transitionReservationAction, null);
  const allowed = reservation.operationStatus === 'PENDING' ? ['CONFIRMED', 'CANCELLED'] : reservation.operationStatus === 'CONFIRMED' ? ['COMPLETED', 'CANCELLED'] : [];
  if (reservation.source !== 'MANUAL_SAAS' || !allowed.length) return null;
  return <form action={action} className="space-y-3 border rounded-xl p-5 bg-white">
    <h2 className="text-lg font-semibold">Cambiar estado operativo</h2><p className="text-sm">Confirmar requiere haber coordinado la disponibilidad. Este cambio no registra cobros ni reembolsos. Cancelar o completar es definitivo.</p>
    <input type="hidden" name="id" value={reservation.id} /><input type="hidden" name="expectedUpdatedAt" value={reservation.updatedAt} />
    <fieldset disabled={pending} className="space-y-3"><label className="block">Nuevo estado<select name="status" className={inputClass}>{allowed.map((s) => <option key={s} value={s}>{operationLabels[s]}</option>)}</select></label><label className="block">Motivo o detalle<textarea name="note" className={inputClass} required minLength={3} maxLength={1000} /></label><label className="flex gap-2"><input type="checkbox" required />Confirmo el cambio de estado.</label><button className={buttonClass} disabled={pending}>{pending ? 'Guardando…' : 'Aplicar cambio'}</button></fieldset>
    {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
  </form>;
}
