import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  CalendarCheck2,
  Compass,
  Layers,
  Users2,
  Bell,
  ArrowRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Search,
} from 'lucide-react';
import { isApiAdmin } from '../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';
import { canEditCatalog, catalogDetailSchema, type CatalogDetail } from '../../lib/catalog-editor';
import { CatalogEditor } from '../../components/workspace/catalog-editor';
import { TeamManager } from './team-manager';
import { PageHeader } from '../../components/design-system/page-header';
import { StatusBadge } from '../../components/design-system/status-badge';
import { EmptyState } from '../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

const memberSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      isActive: z.boolean(),
      user: z.object({ id: z.string(), name: z.string().nullable(), email: z.string() }),
    }),
  ),
  nextCursor: z.string().nullable(),
});

const invitationSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      role: z.string(),
      expiresAt: z.string(),
      acceptedAt: z.string().nullable(),
      revokedAt: z.string().nullable(),
      createdAt: z.string(),
      invitedBy: z
        .object({ id: z.string(), name: z.string().nullable(), email: z.string() })
        .nullable()
        .optional(),
    }),
  ),
});

const catalogSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      hasSharedService: z.boolean(),
      sharedPrice: z.number().nullable(),
      isActive: z.boolean().optional(),
      isPublished: z.boolean(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

const reservationItemSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  serviceTitle: z.string().nullable(),
  date: z.string(),
  pax: z.number(),
  totalPrice: z.number(),
  totalMinor: z.number().nullable().optional(),
  currency: z.string(),
  operationStatus: z.string().nullable(),
  customerFirstName: z.string(),
  customerLastName: z.string(),
});

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isApiAdmin()) redirect('/');

  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Sesión no disponible"
        description="No fue posible conectar con el servicio central. Vuelve a iniciar sesión."
        action={
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Iniciar sesión
          </Link>
        }
      />
    );
  }

  const { token, identity } = session;
  const params = await searchParams;
  const view = params.view;

  // =========================================================================
  // VIEW: HOME (Canonical SaaS Action Dashboard)
  // =========================================================================
  if (!view || view === 'home') {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

    const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

    // Fetch operational data in parallel
    const [resData, dispatchData, toursData, transfersData, notifData] = await Promise.all([
      centralRequest(`${base}/reservations?limit=30`, token).catch(() => ({ data: [] })),
      centralRequest(`${base}/operations/dispatch?date=${today}`, token).catch(() => ({
        total: 0,
        data: [],
      })),
      centralRequest(`${base}/catalog/tours`, token).catch(() => ({ data: [] })),
      centralRequest(`${base}/catalog/transfers`, token).catch(() => ({ data: [] })),
      ['OWNER', 'ADMIN'].includes(identity.role)
        ? centralRequest(`${base}/notifications?limit=10`, token).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ]);

    const reservations = z
      .object({ data: z.array(reservationItemSchema) })
      .safeParse(resData).data?.data || [];
    const dispatchTotal = typeof dispatchData?.total === 'number' ? dispatchData.total : 0;
    const dispatchItems = Array.isArray(dispatchData?.data) ? dispatchData.data : [];
    const dispatchIncomplete = dispatchItems.filter((item: any) => item?.missing?.any).length;

    const tours = catalogSchema.safeParse(toursData).data?.data || [];
    const transfers = catalogSchema.safeParse(transfersData).data?.data || [];

    // Filter today's reservations
    const reservationsToday = reservations.filter((r) => r.date.slice(0, 10) === today).length;
    const pendingReservations = reservations.filter((r) => r.operationStatus === 'PENDING').length;

    // Commercial booked value (Payments frozen / Provider deferred)
    const bookedMinorTotal = reservations.reduce((acc, r) => {
      const minor = r.totalMinor ?? Math.round(r.totalPrice * 100);
      return acc + (isNaN(minor) ? 0 : minor);
    }, 0);

    const formattedBookedValue = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
    }).format(bookedMinorTotal / 100);

    return (
      <div className="space-y-6">
        <PageHeader
          title={`Espacio de ${identity.agencyName}`}
          description="Panel de control operativo y estado comercial de tu agencia."
          badges={<StatusBadge status="ACTIVE" label="Agencia Activa" />}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/workspace/reservations?new=1"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva reserva</span>
              </Link>
            </div>
          }
        />

        {/* Live Email Transport Notification Banner */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/70 flex items-start gap-3">
          <div className="p-1 rounded-lg bg-sky-100 text-sky-700 shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-semibold text-sky-900 block">
              LIVE EMAIL TRANSPORT: NOT CONFIGURED
            </span>
            <p className="text-sky-700 mt-0.5 leading-relaxed">
              El outbox transaccional duradero está activo y cifrado. Los correos de invitaciones y reservas quedan encolados de forma segura en la base de datos hasta la conexión del proveedor de mensajería en vivo.
            </p>
          </div>
          <Link
            href="/workspace/notifications"
            className="text-xs font-semibold text-sky-800 hover:text-sky-950 underline underline-offset-2 shrink-0 self-center"
          >
            Ver outbox
          </Link>
        </div>

        {/* Action Metrics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Servicios Hoy ({today})</span>
              <CalendarCheck2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{reservationsToday}</div>
            <p className="text-[11px] text-slate-500">
              {dispatchTotal} servicios programados en despacho
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Operaciones por Atender</span>
              <Compass className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{dispatchIncomplete}</div>
            <p className="text-[11px] text-slate-500">
              {dispatchIncomplete > 0 ? 'Falta asignar guía/conductor/vehículo' : 'Despacho completo'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Reservas Pendientes</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{pendingReservations}</div>
            <p className="text-[11px] text-slate-500">Pendientes de coordinar o confirmar</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Valor Comercial Reservado</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                FROZEN
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formattedBookedValue}</div>
            <p className="text-[11px] text-slate-400">
              Importe acordado en reservas (pagos diferidos)
            </p>
          </div>
        </div>

        {/* Quick Operations Navigation */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <Link
            href="/workspace/reservations"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Gestión de Reservas
              </span>
              <span className="text-[11px] text-slate-500">
                {reservations.length} reservas registradas
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/workspace/operations"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Despacho y Recursos
              </span>
              <span className="text-[11px] text-slate-500">Guías, conductores y flota</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/workspace?view=tours"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Catálogo de Tours
              </span>
              <span className="text-[11px] text-slate-500">{tours.length} tours configurados</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/workspace?view=transfers"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Catálogo de Traslados
              </span>
              <span className="text-[11px] text-slate-500">
                {transfers.length} traslados configurados
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recent Reservations Snapshot */}
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reservas Recientes</h3>
              <p className="text-xs text-slate-500">Últimos servicios registrados en tu agencia</p>
            </div>
            <Link
              href="/workspace/reservations"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
            >
              Ver todas las reservas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-semibold">Código</th>
                  <th className="py-2.5 px-4 font-semibold">Servicio</th>
                  <th className="py-2.5 px-4 font-semibold">Cliente</th>
                  <th className="py-2.5 px-4 font-semibold">Fecha</th>
                  <th className="py-2.5 px-4 font-semibold">Estado</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.slice(0, 5).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link
                        href={`/workspace/reservations?id=${row.id}`}
                        className="hover:underline font-mono"
                      >
                        {row.code ?? row.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {row.serviceTitle ?? 'Servicio'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.customerFirstName} {row.customerLastName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{row.date.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.operationStatus || 'PENDING'} />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      ${((row.totalMinor ?? Math.round(row.totalPrice * 100)) / 100).toFixed(2)} USD
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Aún no hay reservas registradas en tu agencia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: TOURS, TRANSFERS, MEMBERS (Catalog & Team)
  // =========================================================================
  const canSeeTeam = ['OWNER', 'ADMIN'].includes(identity.role);
  const catalogKind = view === 'transfers' ? 'transfers' : 'tours';
  const canEdit = view !== 'members' && canEditCatalog(identity.role, catalogKind);
  const editing = view !== 'members' && typeof params.edit === 'string';
  let record: CatalogDetail | undefined;
  const cursor =
    typeof params.after === 'string' && params.after.length <= 128 ? params.after : undefined;
  let members: z.infer<typeof memberSchema> | undefined;
  let invitations: z.infer<typeof invitationSchema> | undefined;
  let catalog: z.infer<typeof catalogSchema> | undefined;
  let errorMessage = '';

  if (editing) {
    if (!canEdit) {
      errorMessage = 'Tu rol no permite modificar estos servicios.';
    } else if (params.edit !== 'new') {
      try {
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(params.edit as string)) {
          throw new CentralApiError(404);
        }
        record = catalogDetailSchema.parse(
          await centralRequest(
            `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${catalogKind}/${encodeURIComponent(
              params.edit as string,
            )}`,
            token,
          ),
        );
      } catch {
        errorMessage = 'No pudimos abrir este servicio. Verifica tu sesión y vuelve al catálogo.';
      }
    }
  } else if (view === 'members' && !canSeeTeam) {
    errorMessage = 'Tu rol no permite consultar el equipo.';
  } else {
    try {
      if (view === 'members') {
        const suffix = cursor ? `?after=${encodeURIComponent(cursor)}` : '';
        const [membersBody, invitationsBody] = await Promise.all([
          centralRequest(
            `/v1/agencies/${encodeURIComponent(identity.agencyId)}/memberships${suffix}`,
            token,
          ),
          centralRequest(
            `/v1/agencies/${encodeURIComponent(identity.agencyId)}/invitations`,
            token,
          ),
        ]);
        members = memberSchema.parse(membersBody);
        invitations = invitationSchema.parse(invitationsBody);
      } else {
        const suffix = cursor ? `?after=${encodeURIComponent(cursor)}` : '';
        const body = await centralRequest(
          `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${catalogKind}${suffix}`,
          token,
        );
        catalog = catalogSchema.parse(body);
      }
    } catch (error) {
      if (error instanceof CentralApiError && error.status === 401) {
        redirect('/login?expired=1');
      }
      errorMessage =
        error instanceof CentralApiError && error.status === 403
          ? 'Ya no tienes permiso para consultar esta sección.'
          : 'No pudimos cargar esta sección. Vuelve a intentarlo.';
    }
  }

  const nextCursor = members?.nextCursor ?? catalog?.nextCursor;

  return (
    <div className="space-y-6">
      {/* Editorial Form (Tour or Transfer Editor) */}
      {editing && canEdit && !errorMessage ? (
        <CatalogEditor
          key={`${catalogKind}-${record?.id ?? 'new'}-${record?.updatedAt ?? ''}`}
          kind={catalogKind}
          record={record}
        />
      ) : view === 'members' ? (
        // TEAM MANAGEMENT
        <div className="space-y-6">
          <PageHeader
            title="Equipo y Colaboradores"
            description="Gestiona miembros, roles y autorizaciones de tu espacio de trabajo."
            breadcrumbs={[
              { label: 'Inicio', href: '/workspace' },
              { label: 'Equipo', isCurrent: true },
            ]}
          />

          {errorMessage && (
            <p role="alert" className="text-red-700 bg-red-50 p-4 rounded-xl">
              {errorMessage}
            </p>
          )}

          {members && invitations && (
            <TeamManager
              members={members.data}
              invitations={invitations.data}
              currentRole={identity.role}
              currentUserId={identity.userId}
            />
          )}

          <div className="flex gap-4 text-xs font-semibold pt-2">
            {cursor && (
              <Link href="/workspace?view=members" className="underline">
                Primera página
              </Link>
            )}
            {nextCursor && (
              <Link
                href={`/workspace?view=members&after=${encodeURIComponent(nextCursor)}`}
                className="underline"
              >
                Siguiente página
              </Link>
            )}
          </div>
        </div>
      ) : (
        // CATALOG LIST (Tours or Transfers)
        <div className="space-y-6">
          <PageHeader
            title={view === 'tours' ? 'Catálogo de Tours' : 'Catálogo de Traslados'}
            description={
              view === 'tours'
                ? 'Experiencias turísticas y excursiones ofrecidas por tu agencia.'
                : 'Servicios de transporte y traslados privados o compartidos.'
            }
            breadcrumbs={[
              { label: 'Inicio', href: '/workspace' },
              { label: view === 'tours' ? 'Tours' : 'Traslados', isCurrent: true },
            ]}
            actions={
              canEdit && (
                <Link
                  href={`/workspace?view=${view}&edit=new`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear {view === 'tours' ? 'tour' : 'traslado'}</span>
                </Link>
              )
            }
          />

          {params.saved === '1' && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Servicio guardado con éxito.</span>
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="text-red-700 bg-red-50 p-4 rounded-xl border border-red-200">
              {errorMessage}
            </p>
          )}

          {/* Catalog Table */}
          {catalog && (
            <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Servicio</th>
                      <th className="py-3 px-4 font-semibold">Modalidad</th>
                      <th className="py-3 px-4 font-semibold">Tarifa Compartida</th>
                      <th className="py-3 px-4 font-semibold">Estado</th>
                      {view === 'transfers' && (
                        <th className="py-3 px-4 font-semibold">Operatividad</th>
                      )}
                      <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalog.data.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">/{item.slug}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.hasSharedService ? 'Compartido' : 'Solo privado'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.hasSharedService && item.sharedPrice !== null
                            ? new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(item.sharedPrice)
                            : 'Por cotizar'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                        </td>
                        {view === 'transfers' && (
                          <td className="py-3.5 px-4">
                            <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {canEdit && (
                            <Link
                              href={`/workspace?view=${view}&edit=${encodeURIComponent(item.id)}`}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Editar
                            </Link>
                          )}
                          {canEdit && (
                            <Link
                              href={`/workspace/content?kind=${view}&id=${item.id}`}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
                            >
                              Contenido y tarifas
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {catalog.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No hay servicios registrados en esta página.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div>{catalog.data.length} servicios en esta página</div>
                <div className="flex gap-3 font-semibold">
                  {cursor && (
                    <Link href={`/workspace?view=${view}`} className="hover:underline">
                      Primera página
                    </Link>
                  )}
                  {nextCursor && (
                    <Link
                      href={`/workspace?view=${view}&after=${encodeURIComponent(nextCursor)}`}
                      className="hover:underline"
                    >
                      Siguiente página
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
