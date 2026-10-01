'use client';

import React, { useState, useEffect, useActionState } from 'react';
import {
  quoteReservationAction,
  createReservationAction,
  transitionReservationAction,
  assignReservationResourcesAction,
} from './actions';
import {
  operationLabels,
  priceLabel,
  type ReservationQuote,
  type ReservationDetail,
  type ServiceResourceItem,
  type FleetVehicleItem,
} from '../../../lib/reservations';
import { EditorModeSwitch, type EditorMode } from '../../../components/design-system/editor-mode-switch';
import { GuidedProgress, type StepItem } from '../../../components/design-system/guided-progress';
import { RadioCardGroup } from '../../../components/design-system/radio-card';
import { Calculator, CheckCircle2, User, Phone, Mail, MapPin, Clock, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';

const inputClass =
  'block w-full rounded-lg border border-slate-200 p-2.5 mt-1 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all';
const labelClass = 'block text-xs font-semibold text-slate-700 tracking-tight';

const bookingSteps: StepItem[] = [
  { id: 'service', label: '1. Servicio' },
  { id: 'modality', label: '2. Modalidad' },
  { id: 'date-pax', label: '3. Fecha y Pax' },
  { id: 'customer', label: '4. Cliente' },
  { id: 'passengers', label: '5. Pasajeros' },
  { id: 'pickup', label: '6. Recojo' },
  { id: 'review', label: '7. Confirmación' },
];

export function BookingForm({
  service,
  requestKey,
}: {
  requestKey: string;
  service: {
    id: string;
    title: string;
    kind: 'TOUR' | 'TRANSFER';
    hasSharedService: boolean;
    hasPrivateService: boolean;
    vehicles: { id: string; name: string; maxPax: number }[];
  };
}) {
  const [modality, setModality] = useState<'shared' | 'private'>(
    service.hasSharedService ? 'shared' : 'private',
  );
  const [date, setDate] = useState('');
  const [pax, setPax] = useState(1);
  const [vehicleId, setVehicle] = useState('');
  const [quoteState, quoteAction, isQuoting] = useActionState(quoteReservationAction, null);

  // Editor mode: complete vs guided
  const [mode, setMode] = useState<EditorMode>('complete');
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('booking-editor-mode') as EditorMode | null;
      if (saved === 'complete' || saved === 'guided') {
        setMode(saved);
      } else if (window.innerWidth < 768) {
        setMode('guided');
      } else {
        setMode('complete');
      }
    } catch {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMode('guided');
      }
    }
  }, []);

  const selection = {
    kind: service.kind,
    serviceId: service.id,
    modality,
    date,
    pax,
    vehicleId: service.kind === 'TRANSFER' && modality === 'private' ? vehicleId || null : null,
  };

  const quote = quoteState?.quote;
  const currentQuote =
    quote &&
    quote.kind === selection.kind &&
    quote.serviceId === selection.serviceId &&
    quote.modality === modality &&
    quote.date === date &&
    quote.pax === pax &&
    quote.vehicleId === selection.vehicleId
      ? quote
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Nueva Reserva Manual
          </span>
          <h2 className="text-xl font-bold text-slate-900">{service.title}</h2>
        </div>
        <EditorModeSwitch
          mode={mode}
          onChange={(newMode: EditorMode) => {
            setMode(newMode);
            try {
              localStorage.setItem('booking-editor-mode', newMode);
            } catch {}
          }}
        />
      </div>

      {mode === 'guided' && (
        <GuidedProgress
          steps={bookingSteps}
          currentStepIndex={stepIndex}
          onStepClick={(i: number) => setStepIndex(i)}
        />
      )}

      {/* STEP 1: COTIZACIÓN OFICIAL */}
      <form action={quoteAction} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {mode === 'guided' ? 'Paso 1: Modalidad y Fecha' : '1. Parámetros del servicio y cotización'}
            </h3>
            <p className="text-xs text-slate-500">
              Verifica tarifas vigentes antes de generar la reserva.
            </p>
          </div>
          <Calculator className="w-4 h-4 text-slate-400" />
        </div>

        <input type="hidden" name="payload" value={JSON.stringify(selection)} />

        <fieldset disabled={isQuoting} className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Modalidad
            <select
              className={inputClass}
              value={modality}
              onChange={(e) => setModality(e.target.value as 'shared' | 'private')}
            >
              {service.hasSharedService && <option value="shared">Compartida (Grupal)</option>}
              {service.hasPrivateService && <option value="private">Privada (Exclusiva)</option>}
            </select>
          </label>

          <label className={labelClass}>
            Fecha del servicio
            <input
              className={inputClass}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className={labelClass}>
            Pasajeros (Pax)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={100}
              step={1}
              required
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
            />
          </label>

          {service.kind === 'TRANSFER' && modality === 'private' && (
            <label className={`sm:col-span-3 ${labelClass}`}>
              Vehículo comercial
              <select
                required
                className={inputClass}
                value={vehicleId}
                onChange={(e) => setVehicle(e.target.value)}
              >
                <option value="">-- Seleccionar categoría de vehículo --</option>
                {service.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · hasta {v.maxPax} pasajeros
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>

        {quoteState?.error && (
          <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {quoteState.error}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isQuoting || !date}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isQuoting ? 'Calculando tarifa…' : 'Cotizar servicio'}
          </button>
          <span className="text-[11px] text-slate-400">
            Cálculo verificado por el backend central
          </span>
        </div>
      </form>

      {/* STEP 2: CREACIÓN FORM (Activada al recibir cotización válida) */}
      {currentQuote && (
        <CreateForm
          key={currentQuote.quoteHash}
          quote={currentQuote}
          requestKey={requestKey}
          mode={mode}
          stepIndex={stepIndex}
          setStepIndex={setStepIndex}
        />
      )}
    </div>
  );
}

function CreateForm({
  quote,
  requestKey,
  mode,
  stepIndex,
  setStepIndex,
}: {
  quote: ReservationQuote;
  requestKey: string;
  mode: EditorMode;
  stepIndex: number;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [state, action, isPending] = useActionState(createReservationAction, null);

  const [contact, setContact] = useState({
    customerFirstName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: '',
    pickupHotel: '',
    pickupTime: '',
    specialRequirements: '',
  });

  const [passengers, setPassengers] = useState(
    Array.from({ length: quote.pax }, () => ({
      firstName: '',
      lastName: '',
      docType: 'DNI',
      docNumber: '',
    })),
  );

  const { kind, serviceId, modality, date, pax, vehicleId } = quote;
  const payload = {
    selection: { kind, serviceId, modality, date, pax, vehicleId },
    requestKey,
    quoteHash: quote.quoteHash,
    ...contact,
    passengers,
  };

  return (
    <form action={action} className="space-y-6 border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">
          2. Datos del Cliente, Pasajeros y Emisión
        </h3>
        <p className="text-xs text-slate-500">
          Completa la información para registrar la reserva en estado PENDIENTE.
        </p>
      </div>

      {/* Snapshot de Tarifa Cotizada */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-emerald-950 block">
            {quote.title}
          </span>
          <span className="text-emerald-800">
            {date} · {pax} pasajeros · {modality === 'shared' ? 'Compartida' : 'Privada'}
            {quote.vehicleName ? ` · ${quote.vehicleName}` : ''}
          </span>
          <div className="text-[11px] text-emerald-700">
            Tarifa: {priceLabel(quote.unitPriceMinor)} {quote.pricingUnit === 'GROUP' ? 'por vehículo' : 'por persona'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-700 block font-medium">Total Cotizado</span>
          <span className="text-xl font-bold text-emerald-950">
            {priceLabel(quote.totalMinor)}
          </span>
        </div>
      </div>

      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <fieldset disabled={isPending} className="space-y-5">
        {/* Contacto del Cliente */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Contacto del Cliente Principal</span>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Nombres
              <input
                className={inputClass}
                required
                maxLength={100}
                placeholder="Ej. Juan"
                value={contact.customerFirstName}
                onChange={(e) => setContact({ ...contact, customerFirstName: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Apellidos
              <input
                className={inputClass}
                required
                maxLength={100}
                placeholder="Ej. Pérez Quispe"
                value={contact.customerLastName}
                onChange={(e) => setContact({ ...contact, customerLastName: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Correo electrónico
              <input
                className={inputClass}
                type="email"
                required
                maxLength={254}
                placeholder="cliente@ejemplo.com"
                value={contact.customerEmail}
                onChange={(e) => setContact({ ...contact, customerEmail: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Teléfono de contacto
              <input
                className={inputClass}
                type="tel"
                required
                maxLength={40}
                placeholder="+51 987 654 321"
                value={contact.customerPhone}
                onChange={(e) => setContact({ ...contact, customerPhone: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Recojo y Logística */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Recojo y Observaciones</span>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Lugar / Hotel de recojo (opcional)
              <input
                className={inputClass}
                maxLength={300}
                placeholder="Ej. Hotel Monasterio, Cusco"
                value={contact.pickupHotel}
                onChange={(e) => setContact({ ...contact, pickupHotel: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Hora local de recojo (opcional)
              <input
                className={inputClass}
                type="time"
                value={contact.pickupTime}
                onChange={(e) => setContact({ ...contact, pickupTime: e.target.value })}
              />
            </label>
            <label className={`sm:col-span-2 ${labelClass}`}>
              Observaciones o requerimientos especiales
              <textarea
                className={inputClass}
                rows={2}
                maxLength={2000}
                placeholder="Restricciones dietéticas, requerimientos de oxígeno, equipaje especial..."
                value={contact.specialRequirements}
                onChange={(e) => setContact({ ...contact, specialRequirements: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Pasajeros */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Manifiesto de Pasajeros ({passengers.length})</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">
            El documento de identidad es opcional en esta fase inicial.
          </p>

          <div className="space-y-3">
            {passengers.map((p, index) => (
              <div
                key={index}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 grid gap-3 sm:grid-cols-4"
              >
                <label className={labelClass}>
                  Nombres
                  <input
                    className={inputClass}
                    required
                    maxLength={100}
                    value={p.firstName}
                    onChange={(e) =>
                      setPassengers(
                        passengers.map((row, i) =>
                          i === index ? { ...row, firstName: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className={labelClass}>
                  Apellidos
                  <input
                    className={inputClass}
                    required
                    maxLength={100}
                    value={p.lastName}
                    onChange={(e) =>
                      setPassengers(
                        passengers.map((row, i) =>
                          i === index ? { ...row, lastName: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className={labelClass}>
                  Tipo documento
                  <select
                    className={inputClass}
                    value={p.docType}
                    onChange={(e) =>
                      setPassengers(
                        passengers.map((row, i) =>
                          i === index ? { ...row, docType: e.target.value } : row,
                        ),
                      )
                    }
                  >
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="CE">Carnet Extranjería</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Número doc.
                  <input
                    className={inputClass}
                    maxLength={40}
                    placeholder="Opcional"
                    value={p.docNumber}
                    onChange={(e) =>
                      setPassengers(
                        passengers.map((row, i) =>
                          i === index ? { ...row, docNumber: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Declaración de emisión */}
        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 mt-0.5"
          />
          <span>
            Confirmo que revisé servicio, fecha, pasajeros e importe. Se creará una reserva operativa en estado PENDIENTE sin registrar cobros (pagos diferidos / frozen).
          </span>
        </label>

        {state?.error && (
          <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Emitiendo reserva…' : 'Crear reserva pendiente'}
        </button>
      </fieldset>
    </form>
  );
}

export function StatusForm({ reservation }: { reservation: ReservationDetail }) {
  const [state, action, pending] = useActionState(transitionReservationAction, null);
  const allowed =
    reservation.operationStatus === 'PENDING'
      ? ['CONFIRMED', 'CANCELLED']
      : reservation.operationStatus === 'CONFIRMED'
        ? ['COMPLETED', 'CANCELLED']
        : [];

  if (reservation.source !== 'MANUAL_SAAS' || !allowed.length) return null;

  return (
    <form action={action} className="space-y-4 border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
      <div className="border-b border-slate-100 pb-2">
        <h2 className="text-base font-bold text-slate-900">
          Transición de Estado Operativo
        </h2>
        <p className="text-xs text-slate-500">
          Confirmar requiere haber coordinado la disponibilidad. Este cambio no registra cobros ni reembolsos. Cancelar o completar es definitivo.
        </p>
      </div>

      <input type="hidden" name="id" value={reservation.id} />
      <input type="hidden" name="expectedUpdatedAt" value={reservation.updatedAt} />

      <fieldset disabled={pending} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Nuevo estado
            <select name="status" className={inputClass}>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {operationLabels[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Motivo o nota de la transición
          <textarea
            name="note"
            className={inputClass}
            required
            rows={2}
            minLength={3}
            maxLength={1000}
            placeholder="Detalla el motivo del cambio de estado..."
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded text-slate-900 border-slate-300"
          />
          <span>Confirmo el cambio de estado operativo.</span>
        </label>

        {state?.error && (
          <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          disabled={pending}
        >
          {pending ? 'Guardando…' : 'Aplicar cambio de estado'}
        </button>
      </fieldset>
    </form>
  );
}

export function OperationsAssignmentForm({
  reservation,
  guides,
  drivers,
  vehicles,
}: {
  reservation: ReservationDetail;
  guides: ServiceResourceItem[];
  drivers: ServiceResourceItem[];
  vehicles: FleetVehicleItem[];
}) {
  const [state, action, pending] = useActionState(assignReservationResourcesAction, null);
  const assignments = reservation.assignments;
  const isReadOnly =
    reservation.operationStatus === 'CANCELLED' || reservation.operationStatus === 'COMPLETED';

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
      <div className="border-b border-slate-100 pb-2">
        <h2 className="text-base font-bold text-slate-900">
          Asignación de Recursos Operativos
        </h2>
        <p className="text-xs text-slate-500">
          Asigna guía, conductor y vehículo de flota para la ejecución de este servicio en la fecha {reservation.date.slice(0, 10)}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Guía asignado</span>
          <strong className="text-slate-900 text-sm">
            {assignments?.guide
              ? `${assignments.guide.displayName}${assignments.guide.phone ? ` (${assignments.guide.phone})` : ''}`
              : 'Sin asignar'}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Conductor asignado</span>
          <strong className="text-slate-900 text-sm">
            {assignments?.driver
              ? `${assignments.driver.displayName}${assignments.driver.phone ? ` (${assignments.driver.phone})` : ''}`
              : 'Sin asignar'}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Vehículo de flota</span>
          <strong className="text-slate-900 text-sm">
            {assignments?.vehicle
              ? `${assignments.vehicle.internalLabel} [${assignments.vehicle.plate}] · ${assignments.vehicle.vehicleTypeName}`
              : 'Sin asignar'}
          </strong>
        </div>
      </div>

      {isReadOnly ? (
        <p className="text-xs bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">
          {reservation.operationStatus === 'CANCELLED'
            ? 'Reserva cancelada: las asignaciones están congeladas.'
            : 'Reserva completada: las asignaciones se conservan como registro histórico.'}
        </p>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={reservation.id} />
          <input type="hidden" name="expectedUpdatedAt" value={reservation.updatedAt} />

          <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Guía
              <select
                name="guideId"
                defaultValue={assignments?.guide?.id ?? 'none'}
                className={inputClass}
              >
                <option value="none">-- Sin guía asignado --</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.displayName} {g.phone ? `(${g.phone})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Conductor
              <select
                name="driverId"
                defaultValue={assignments?.driver?.id ?? 'none'}
                className={inputClass}
              >
                <option value="none">-- Sin conductor asignado --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName} {d.phone ? `(${d.phone})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Vehículo de flota
              <select
                name="vehicleId"
                defaultValue={assignments?.vehicle?.id ?? 'none'}
                className={inputClass}
              >
                <option value="none">-- Sin vehículo asignado --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.internalLabel} [{v.plate}] · {v.vehicleType.name} (cap:{' '}
                    {v.capacity ?? v.vehicleType.maxPax})
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <label className={labelClass}>
            Observaciones operativas (opcional)
            <input
              type="text"
              name="note"
              maxLength={1000}
              placeholder="Ej: Confirmado vía WhatsApp con el conductor."
              className={inputClass}
            />
          </label>

          {state?.error && (
            <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            disabled={pending}
          >
            {pending ? 'Guardando asignación…' : 'Guardar asignación de recursos'}
          </button>
        </form>
      )}
    </section>
  );
}
