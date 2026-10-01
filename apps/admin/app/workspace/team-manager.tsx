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
          className="p-3.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl text-xs font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626]" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div
          role="status"
          className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] rounded-xl text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16a34a]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* FORMULARIO DE INVITACIÓN */}
      {(isOwner || isAdmin) && (
        <div className="bg-white rounded-xl shadow-cal-surface p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#6b7280]" />
              <span>Invitar a un nuevo colaborador</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Genera una invitación segura. Se emitirá una notificación transaccional duradera y enlace criptográfico de registro.
            </p>
          </div>

          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end pt-1">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Correo electrónico institucional *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@correo.com"
                disabled={isPending}
                className="w-full text-xs sm:text-sm border border-[#e5e7eb] rounded-lg h-10 px-3 bg-white disabled:bg-[#f8f9fa] focus:outline-none focus:ring-1 focus:ring-[#111111]"
              />
            </div>

            <div className="w-[180px]">
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Rol en la agencia *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={isPending}
                className="w-full text-xs sm:text-sm border border-[#e5e7eb] rounded-lg h-10 px-3 bg-white disabled:bg-[#f8f9fa] focus:outline-none focus:ring-1 focus:ring-[#111111]"
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
              className="h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white text-xs font-semibold rounded-md shadow-none transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Enviando…' : 'Crear Invitación'}
            </button>
          </form>
        </div>
      )}

      {/* TABLA DE MIEMBROS ACTIVOS / REGISTRADOS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#111111]">
          Miembros del Equipo ({members.length})
        </h3>
        <div className="rounded-xl bg-white shadow-cal-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Persona</th>
                  <th className="py-3 px-4 font-semibold">Rol</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  {(isOwner || isAdmin) && (
                    <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {members.map((member) => {
                  const isSelf = member.user.id === currentUserId;
                  const targetIsOwner = member.role === 'OWNER';
                  const canModifyTarget =
                    isOwner || (isAdmin && !targetIsOwner && member.role !== 'ADMIN');

                  return (
                    <tr key={member.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#111111] text-sm">
                          {member.user.name || member.user.email}
                          {isSelf && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-[#f3f4f6] text-[#111111] rounded border border-[#e5e7eb]">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6b7280] font-mono">
                          {member.user.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {canModifyTarget && !isSelf ? (
                          <select
                            value={member.role}
                            disabled={isPending}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="border border-[#e5e7eb] rounded-lg px-2.5 py-1 text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#111111]"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r] || r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2.5 py-1 text-xs rounded-md bg-[#f3f4f6] text-[#111111] font-medium border border-[#e5e7eb]">
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
                                className="px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors cursor-pointer"
                              >
                                {member.isActive ? 'Desactivar' : 'Reactivar'}
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDeleteMember(member.id, member.user.email)}
                                className="px-2 py-1 text-xs text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors cursor-pointer"
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
          <h3 className="text-sm font-semibold text-[#111111]">
            Invitaciones Pendientes ({pendingInvitations.length})
          </h3>
          <div className="rounded-xl bg-white shadow-cal-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Destinatario</th>
                    <th className="py-3 px-4 font-semibold">Rol Asignado</th>
                    <th className="py-3 px-4 font-semibold">Expira</th>
                    <th className="py-3 px-4 font-semibold">Invitado por</th>
                    {(isOwner || isAdmin) && (
                      <th className="py-3 px-4 font-semibold text-right">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#111111] font-mono">
                        {inv.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-[#f3f4f6] text-[#111111] font-medium border border-[#e5e7eb]">
                          {roleLabels[inv.role] || inv.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#6b7280]">
                        {new Date(inv.expiresAt).toLocaleDateString('es-PE', {
                          timeZone: 'America/Lima',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-[#374151]">
                        {inv.invitedBy?.name || inv.invitedBy?.email || 'Sistema'}
                      </td>
                      {(isOwner || isAdmin) && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors cursor-pointer"
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
