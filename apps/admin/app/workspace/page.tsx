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
          title="Inicio"
          description={`Resumen operativo de ${identity.agencyName}`}
          badges={<StatusBadge status="ACTIVE" label="Agencia Activa" />}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/workspace/reservations?new=1"
                className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva reserva</span>
              </Link>
            </div>
          }
        />

        {/* Live Email Transport Quiet System Notice */}
        <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#374151]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#898989] shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">
              Correo transaccional pendiente de configurar
            </span>
            <span className="hidden sm:inline text-[#6b7280]">
              — Outbox duradero y cifrado activo (LIVE EMAIL TRANSPORT: NOT CONFIGURED)
            </span>
          </div>
          <Link
            href="/workspace/notifications"
            className="text-xs font-medium text-[#111111] hover:underline underline-offset-2 shrink-0 ml-3"
          >
            Ver outbox
          </Link>
        </div>

        {/* Flat Operational Metrics Row (Whitespace + Typography + Hairline Divider) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-3 border-b border-[#e5e7eb]">
          <div className="space-y-1">
            <span className="text-xs text-[#6b7280] font-medium block">Servicios hoy</span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">{reservationsToday}</div>
            <p className="text-[11px] text-[#6b7280]">
              {dispatchTotal === 0 ? 'Sin servicios programados' : `${dispatchTotal} programados en despacho`}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#6b7280] font-medium block">Operaciones pendientes</span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">{dispatchIncomplete}</div>
            <p className="text-[11px] text-[#6b7280]">
              {dispatchIncomplete > 0 ? 'Falta asignar recursos' : 'Despacho completo'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#6b7280] font-medium block">Reservas pendientes</span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">{pendingReservations}</div>
            <p className="text-[11px] text-[#6b7280]">Pendientes de coordinar</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6b7280] font-medium block">Valor reservado</span>
              <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
                Frozen
              </span>
            </div>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">{formattedBookedValue}</div>
            <p className="text-[11px] text-[#898989]">
              Importe pactado (pagos diferidos)
            </p>
          </div>
        </div>

        {/* Recent Reservations Snapshot (One Grouped List Container) */}
        <div className="rounded-xl bg-white shadow-cal-surface overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111111]">Reservas Recientes</h3>
              <p className="text-xs text-[#6b7280]">Últimos servicios registrados en tu agencia</p>
            </div>
            <Link
              href="/workspace/reservations"
              className="text-xs font-medium text-[#111111] hover:underline underline-offset-2"
            >
              Ver todas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4 font-medium">Código</th>
                  <th className="py-2.5 px-4 font-medium">Servicio</th>
                  <th className="py-2.5 px-4 font-medium">Cliente</th>
                  <th className="py-2.5 px-4 font-medium">Fecha</th>
                  <th className="py-2.5 px-4 font-medium">Estado</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {reservations.slice(0, 5).map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#111111]">
                      <Link
                        href={`/workspace/reservations?id=${row.id}`}
                        className="hover:underline font-mono"
                      >
                        {row.code ?? row.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[#111111] font-medium">
                      {row.serviceTitle ?? 'Servicio'}
                    </td>
                    <td className="py-3 px-4 text-[#374151]">
                      {row.customerFirstName} {row.customerLastName}
                    </td>
                    <td className="py-3 px-4 text-[#6b7280]">{row.date.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.operationStatus || 'PENDING'} />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111111]">
                      ${((row.totalMinor ?? Math.round(row.totalPrice * 100)) / 100).toFixed(2)} USD
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#898989]">
                      No hay reservas todavía
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
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none transition-colors"
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
              className="p-3 rounded-lg bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
              <span>Servicio guardado con éxito.</span>
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {errorMessage}
            </p>
          )}

          {/* Catalog Table (Grouped List Container) */}
          {catalog && (
            <div className="rounded-xl bg-white shadow-cal-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4 font-medium">Servicio</th>
                      <th className="py-2.5 px-4 font-medium">Modalidad</th>
                      <th className="py-2.5 px-4 font-medium">Tarifa Compartida</th>
                      <th className="py-2.5 px-4 font-medium">Estado</th>
                      {view === 'transfers' && (
                        <th className="py-2.5 px-4 font-medium">Operatividad</th>
                      )}
                      <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {catalog.data.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111111] text-sm">{item.title}</div>
                          <div className="text-[11px] text-[#6b7280] font-mono">/{item.slug}</div>
                        </td>
                        <td className="py-3 px-4 text-[#374151]">
                          {item.hasSharedService ? 'Compartido' : 'Solo privado'}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#111111]">
                          {item.hasSharedService && item.sharedPrice !== null
                            ? new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(item.sharedPrice)
                            : 'Por cotizar'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                        </td>
                        {view === 'transfers' && (
                          <td className="py-3 px-4">
                            <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                          </td>
                        )}
                        <td className="py-3 px-4 text-right space-x-2">
                          {canEdit && (
                            <Link
                              href={`/workspace?view=${view}&edit=${encodeURIComponent(item.id)}`}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-white shadow-cal-ring hover:bg-[#f8f9fa] rounded-md transition-colors"
                            >
                              Editar
                            </Link>
                          )}
                          {canEdit && (
                            <Link
                              href={`/workspace/content?kind=${view}&id=${item.id}`}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#6b7280] hover:text-[#111111] hover:underline underline-offset-2 transition-colors"
                            >
                              Contenido
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {catalog.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#898989]">
                          No hay servicios registrados en esta página.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
                <div>{catalog.data.length} servicios en esta página</div>
                <div className="flex gap-3 font-medium">
                  {cursor && (
                    <Link href={`/workspace?view=${view}`} className="hover:underline text-[#111111]">
                      Primera página
                    </Link>
                  )}
                  {nextCursor && (
                    <Link
                      href={`/workspace?view=${view}&after=${encodeURIComponent(nextCursor)}`}
                      className="hover:underline text-[#111111]"
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
