'use client';

import React, { useState, useTransition } from 'react';
import {
  createInvitationAction,
  revokeInvitationAction,
  updateMembershipAction,
  deleteMembershipAction,
  type TeamActionState,
} from './team-actions';

interface MemberItem {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface InvitationItem {
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

interface TeamManagerProps {
  members: MemberItem[];
  invitations: InvitationItem[];
  currentRole: string;
  currentUserId: string;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  OPERATOR: 'Operador',
  VIEWER: 'Consulta',
};

export function TeamManager({
  members,
  invitations,
  currentRole,
  currentUserId,
}: TeamManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(currentRole === 'OWNER' ? 'ADMIN' : 'EDITOR');

  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'ADMIN';

  // Available roles to assign/invite
  const assignableRoles = isOwner
    ? ['OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']
    : ['EDITOR', 'OPERATOR', 'VIEWER'];

  const invitableRoles = isOwner
    ? ['ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']
    : ['EDITOR', 'OPERATOR', 'VIEWER'];

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.set('email', inviteEmail);
    formData.set('role', inviteRole);

    startTransition(async () => {
      const res = await createInvitationAction(null, formData);
      if (res.error) {
        setActionError(res.error);
      } else if (res.success) {
        setActionSuccess(res.deliveryMessage || 'Invitación creada.');
        setInviteEmail('');
      }
    });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await updateMembershipAction(memberId, { role: newRole });
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess('Rol actualizado correctamente.');
      }
    });
  };

  const handleToggleActive = (memberId: string, currentActive: boolean) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await updateMembershipAction(memberId, { isActive: !currentActive });
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(`Miembro ${!currentActive ? 'activado' : 'desactivado'} correctamente.`);
      }
    });
  };

  const handleDeleteMember = (memberId: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente a ${email} del equipo?`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteMembershipAction(memberId);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess('Miembro eliminado del equipo.');
      }
    });
  };

  const handleRevokeInvitation = (invitationId: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await revokeInvitationAction(invitationId);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess('Invitación revocada exitosamente.');
      }
    });
  };

  const pendingInvitations = invitations.filter(
    (inv) => !inv.acceptedAt && !inv.revokedAt && new Date(inv.expiresAt) > new Date()
  );

  return (
    <div className="space-y-8">
      {actionError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div role="status" className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          {actionSuccess}
        </div>
      )}

      {/* FORMULARIO DE INVITACIÓN */}
      {(isOwner || isAdmin) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-md font-semibold text-slate-800">
              Invitar a un nuevo miembro
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Envía una invitación segura. Se generará un enlace criptográfico independiente de la integración de correo.
            </p>
          </div>

          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@correo.com"
                disabled={isPending}
                className="w-full text-sm border rounded-lg p-2.5 bg-white disabled:bg-slate-100"
              />
            </div>

            <div className="w-[180px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Rol en la agencia *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={isPending}
                className="w-full text-sm border rounded-lg p-2.5 bg-white disabled:bg-slate-100"
              >
                {invitableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r] || r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 bg-[#062918] text-white text-sm font-medium rounded-lg hover:bg-[#0a3f25] disabled:opacity-50"
            >
              {isPending ? 'Enviando…' : 'Crear Invitación'}
            </button>
          </form>
        </div>
      )}

      {/* TABLA DE MIEMBROS ACTIVOS / REGISTRADOS */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-slate-800">
          Miembros del Equipo ({members.length})
        </h3>
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Persona</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Estado</th>
                {(isOwner || isAdmin) && <th className="py-3 px-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const isSelf = member.user.id === currentUserId;
                const targetIsOwner = member.role === 'OWNER';
                const canModifyTarget =
                  isOwner || (isAdmin && !targetIsOwner && member.role !== 'ADMIN');

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">
                        {member.user.name || member.user.email}
                      </span>
                      {isSelf && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-200 text-slate-700 rounded">
                          Tú
                        </span>
                      )}
                      <span className="block text-xs text-slate-500">
                        {member.user.email}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {canModifyTarget && !isSelf ? (
                        <select
                          value={member.role}
                          disabled={isPending}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="border rounded px-2 py-1 text-xs bg-white"
                        >
                          {assignableRoles.map((r) => (
                            <option key={r} value={r}>
                              {roleLabels[r] || r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-slate-100 text-slate-800">
                          {roleLabels[member.role] || member.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.isActive ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    {(isOwner || isAdmin) && (
                      <td className="py-3 px-4 text-right space-x-2">
                        {canModifyTarget && !isSelf && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleActive(member.id, member.isActive)}
                            className="text-xs px-2.5 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                          >
                            {member.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                        {isOwner && !isSelf && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDeleteMember(member.id, member.user.email)}
                            className="text-xs px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No hay miembros registrados en esta agencia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA DE INVITACIONES PENDIENTES */}
      {(isOwner || isAdmin) && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-slate-800">
            Invitaciones Pendientes ({pendingInvitations.length})
          </h3>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b">
                <tr>
                  <th className="py-3 px-4">Correo Invitado</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Expira en</th>
                  <th className="py-3 px-4">Invitado por</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {inv.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700">
                        {roleLabels[inv.role] || inv.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {inv.invitedBy?.name || inv.invitedBy?.email || 'Sistema'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="text-xs px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingInvitations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No hay invitaciones pendientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
