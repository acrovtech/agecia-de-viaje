'use client';

import React, { useState, useTransition } from 'react';
import {
  createInvitationAction,
  revokeInvitationAction,
  updateMembershipAction,
  deleteMembershipAction,
  type TeamActionState,
} from './team-actions';
import { StatusBadge } from '../../components/design-system/status-badge';
import { ConfirmDialog } from '../../components/design-system/confirm-dialog';
import { UserPlus, Trash2, Ban, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

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

  // Confirm dialog state (replaces raw browser confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'ADMIN';

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
    // Open accessible confirmation dialog instead of browser confirm()
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Miembro del Equipo',
      description: `¿Estás seguro de revocar la membresía y retirar permanentemente el acceso a ${email}?`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
      },
    });
  };

  const handleRevokeInvitation = (invitationId: string, email: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revocar Invitación',
      description: `¿Deseas invalidar la invitación enviada a ${email}? El enlace ya no podrá ser utilizado.`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
      },
    });
  };

  const pendingInvitations = invitations.filter(
    (inv) => !inv.acceptedAt && !inv.revokedAt && new Date(inv.expiresAt) > new Date(),
  );

  return (
    <div className="space-y-6">
      {/* Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Eliminar acceso"
        isDestructive={true}
        isPending={isPending}
      />

      {actionError && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* FORMULARIO DE INVITACIÓN */}
      {(isOwner || isAdmin) && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>Invitar a un nuevo colaborador</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera una invitación segura. Se emitirá una notificación transaccional duradera y enlace criptográfico de registro.
            </p>
          </div>

          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end pt-1">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico institucional *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@correo.com"
                disabled={isPending}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 bg-white disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="w-[180px]">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rol en la agencia *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={isPending}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2.5 bg-white disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              disabled={isPending || !inviteEmail}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Enviando…' : 'Crear Invitación'}
            </button>
          </form>
        </div>
      )}

      {/* TABLA DE MIEMBROS ACTIVOS / REGISTRADOS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Miembros del Equipo ({members.length})
        </h3>
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Persona</th>
                  <th className="py-3 px-4 font-semibold">Rol</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  {(isOwner || isAdmin) && (
                    <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isSelf = member.user.id === currentUserId;
                  const targetIsOwner = member.role === 'OWNER';
                  const canModifyTarget =
                    isOwner || (isAdmin && !targetIsOwner && member.role !== 'ADMIN');

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {member.user.name || member.user.email}
                          {isSelf && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {member.user.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {canModifyTarget && !isSelf ? (
                          <select
                            value={member.role}
                            disabled={isPending}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="border border-slate-200 rounded px-2.5 py-1 text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r] || r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200/80">
                            {roleLabels[member.role] || member.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={member.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      {(isOwner || isAdmin) && (
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {canModifyTarget && !isSelf && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleActive(member.id, member.isActive)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                {member.isActive ? 'Desactivar' : 'Reactivar'}
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDeleteMember(member.id, member.user.email)}
                                className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar miembro del equipo"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TABLA DE INVITACIONES PENDIENTES */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900">
            Invitaciones Pendientes ({pendingInvitations.length})
          </h3>
          <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Destinatario</th>
                    <th className="py-3 px-4 font-semibold">Rol Asignado</th>
                    <th className="py-3 px-4 font-semibold">Expira</th>
                    <th className="py-3 px-4 font-semibold">Invitado por</th>
                    {(isOwner || isAdmin) && (
                      <th className="py-3 px-4 font-semibold text-right">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {inv.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 font-medium">
                          {roleLabels[inv.role] || inv.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(inv.expiresAt).toLocaleDateString('es-PE', {
                          timeZone: 'America/Lima',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.invitedBy?.name || inv.invitedBy?.email || 'Sistema'}
                      </td>
                      {(isOwner || isAdmin) && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Revocar</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
