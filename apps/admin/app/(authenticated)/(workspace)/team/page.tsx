import React from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { TeamView } from '@/components/workspace/views/team-view';
import { EmptyState } from '@/components/design-system/empty-state';
import { canAccessTeamUi } from '@/lib/team-auth';
import Link from 'next/link';

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

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isApiAdmin()) {
    redirect('/');
  }

  const params = await searchParams;
  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    throw error;
  }

  const { token, identity } = session;
  const canSeeTeam = canAccessTeamUi(identity.role);
  if (!canSeeTeam) {
    return (
      <EmptyState
        title="Acceso Restringido"
        description="Tu rol no permite consultar el equipo de la agencia."
        action={
          <Link href="/dashboard" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  const cursor = typeof params.after === 'string' && params.after.length <= 128 ? params.after : '';
  const suffix = cursor ? `?after=${encodeURIComponent(cursor)}` : '';

  try {
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
    const members = memberSchema.parse(membersBody);
    const invitations = invitationSchema.parse(invitationsBody);

    return (
      <TeamView
        members={members.data}
        invitations={invitations.data}
        currentRole={identity.role}
        currentUserId={identity.userId}
        cursor={cursor}
        nextCursor={members.nextCursor}
      />
    );
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    const errorMessage =
      error instanceof CentralApiError && error.status === 403
        ? 'Ya no tienes permiso para consultar esta sección.'
        : 'No pudimos cargar esta sección. Vuelve a intentarlo.';

    return (
      <TeamView
        members={[]}
        invitations={[]}
        currentRole={identity.role}
        currentUserId={identity.userId}
        errorMessage={errorMessage}
      />
    );
  }
}
