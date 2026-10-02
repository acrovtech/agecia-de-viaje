import Link from 'next/link';
import { PageHeader } from '../../design-system/page-header';
import { TeamManager } from '../../../app/workspace/team-manager';

export interface TeamMemberItem {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TeamInvitationItem {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface TeamViewProps {
  members: TeamMemberItem[];
  invitations: TeamInvitationItem[];
  currentRole: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'EDITOR' | 'VIEWER';
  currentUserId: string;
  cursor?: string;
  nextCursor?: string | null;
  errorMessage?: string;
}

export function TeamView({
  members,
  invitations,
  currentRole,
  currentUserId,
  cursor,
  nextCursor,
  errorMessage,
}: TeamViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo y Colaboradores"
        description="Gestiona miembros, roles y autorizaciones de tu espacio de trabajo."
      />

      {errorMessage && (
        <p role="alert" className="text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 text-xs">
          {errorMessage}
        </p>
      )}

      <TeamManager
        members={members}
        invitations={invitations}
        currentRole={currentRole}
        currentUserId={currentUserId}
      />

      <div className="flex gap-4 text-xs font-semibold pt-2">
        {cursor && (
          <Link href="/team" className="underline text-slate-800 hover:text-black">
            Primera página
          </Link>
        )}
        {nextCursor && (
          <Link
            href={`/team?after=${encodeURIComponent(nextCursor)}`}
            className="underline text-slate-800 hover:text-black"
          >
            Siguiente página
          </Link>
        )}
      </div>
    </div>
  );
}
