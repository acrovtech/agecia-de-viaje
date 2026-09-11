'use client';

import { useState, useTransition } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Headset, 
  PenTool, 
  Search, 
  Trash2, 
  Edit3, 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { Role } from '@repo/db';
import { 
  createUserAction, 
  updateUserAction, 
  toggleUserStatusAction, 
  unlockUserAccountAction, 
  deleteUserAction 
} from '@/app/actions/user';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ROLE_DEFINITIONS, getRoleMetadata } from '@/lib/roles';

interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function UsuariosClient({ initialUsers }: { initialUsers: AdminUserItem[] }) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id?: string; email?: string }>({
    isOpen: false,
  });

  // Campos de formulario
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<Role>('OPERATOR');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Estadísticas rápidas
  const totalUsers = users.length;
  const superAdminCount = users.filter((u) => u.role === 'SUPERADMIN').length;
  const masterCount = users.filter((u) => u.role === 'MASTER').length;
  const operatorCount = users.filter((u) => u.role === 'OPERATOR').length;
  const contentCount = users.filter((u) => u.role === 'CONTENT_CREATOR').length;

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('OPERATOR');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUserItem) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email);
    setFormPassword(''); // Contraseña en blanco a menos que se quiera resetear
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      if (editingUser) {
        // Actualización
        const res = await updateUserAction({
          id: editingUser.id,
          name: formName,
          email: formEmail,
          role: formRole,
          isActive: formIsActive,
          password: formPassword.trim() ? formPassword : undefined,
        });

        if (res.success && res.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.user! } : u))
          );
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: 'Usuario actualizado correctamente.' });
        } else {
          setFormError(res.error || 'Error al actualizar usuario.');
        }
      } else {
        // Creación
        if (!formPassword) {
          setFormError('La contraseña inicial es requerida.');
          return;
        }

        const res = await createUserAction({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          isActive: formIsActive,
        });

        if (res.success && res.user) {
          setUsers((prev) => [res.user as any, ...prev]);
          setIsModalOpen(false);
          setFeedback({ type: 'success', message: 'Usuario creado exitosamente.' });
        } else {
          setFormError(res.error || 'Error al registrar usuario.');
        }
      }
    });
  };

  const handleToggleStatus = (user: AdminUserItem) => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(user.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: res.isActive! } : u))
        );
        setFeedback({
          type: 'success',
          message: `Usuario ${res.isActive ? 'activado' : 'desactivado'} con éxito.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo cambiar el estado.' });
      }
    });
  };

  const handleUnlock = (userId: string) => {
    startTransition(async () => {
      const res = await unlockUserAccountAction(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: null } : u
          )
        );
        setFeedback({ type: 'success', message: 'Cuenta desbloqueada correctamente.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo desbloquear la cuenta.' });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteModal.id) return;
    startTransition(async () => {
      const res = await deleteUserAction(deleteModal.id!);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
        setDeleteModal({ isOpen: false });
        setFeedback({ type: 'success', message: 'Usuario eliminado del sistema.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo eliminar el usuario.' });
        setDeleteModal({ isOpen: false });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración centralizada de cuentas de acceso, jerarquías de seguridad y auditoría.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* FEEDBACK DE ACCIONES */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TARJETAS RESUMEN DE ROLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Total Usuarios</p>
            <p className="text-lg font-bold text-slate-900">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-neutral-900 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Administradores Master</p>
            <p className="text-lg font-bold text-slate-900">{masterCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Operadores de Reservas</p>
            <p className="text-lg font-bold text-slate-900">{operatorCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Gestores de Contenidos</p>
            <p className="text-lg font-bold text-slate-900">{contentCount}</p>
          </div>
        </div>
      </div>

      {/* MATRIZ VISUAL DE ROLES Y PRIVILEGIOS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          Matriz de Privilegios y Roles en Inca Bound
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(ROLE_DEFINITIONS).map((roleDef) => (
            <div
              key={roleDef.key}
              className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${roleDef.badgeClass}`}>
                    {roleDef.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                  {roleDef.shortDescription}
                </p>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                {roleDef.permissions.slice(0, 3).map((perm, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-medium text-slate-500 shrink-0">Filtrar por rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">Todos los roles</option>
            <option value="SUPERADMIN">SuperAdmin (Root)</option>
            <option value="MASTER">Master</option>
            <option value="OPERATOR">Operador</option>
            <option value="CONTENT_CREATOR">Contenidos</option>
          </select>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5">Rol de Acceso</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Telemetría de Seguridad</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleMeta = getRoleMetadata(user.role);
                  const isLocked = user.lockedUntil && new Date() < new Date(user.lockedUntil);
                  const userInitials = (user.name || user.email)
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join('') || user.email.slice(0, 2).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* 1. Nombre & Email */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {userInitials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.name || 'Sin nombre registrado'}
                            </p>
                            <p className="text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Rol Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeClass}`}
                        >
                          {user.role === 'MASTER' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : user.role === 'OPERATOR' ? (
                            <Headset className="w-3 h-3" />
                          ) : (
                            <PenTool className="w-3 h-3" />
                          )}
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* 3. Estado */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 w-fit">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Bloqueado temporalmente
                            </span>
                          ) : user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 w-fit">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Telemetría */}
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {user.lastLoginAt ? (
                          <div>
                            <p className="text-slate-700 font-medium">
                              {new Date(user.lastLoginAt).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {user.lastLoginIp && (
                              <p className="text-[10px] text-slate-400">IP: {user.lastLoginIp}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin ingresos registrados</span>
                        )}
                        {user.failedLoginAttempts > 0 && !isLocked && (
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            Intentos fallidos: {user.failedLoginAttempts}
                          </p>
                        )}
                      </td>

                      {/* 5. Acciones */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {isLocked && (
                            <button
                              type="button"
                              onClick={() => handleUnlock(user.id)}
                              disabled={isPending}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Desbloquear cuenta de usuario"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isPending}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.isActive ? 'Desactivar acceso' : 'Activar acceso'}
                          >
                            {user.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            disabled={isPending}
                            className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar usuario y rol"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({ isOpen: true, id: user.id, email: user.email })
                            }
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900">
                {editingUser ? 'Editar Usuario y Rol' : 'Registrar Nuevo Usuario'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Correo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nombre@agenciadeviajes.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol de Seguridad</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="OPERATOR">Operador de Reservas (OPERATOR)</option>
                  <option value="CONTENT_CREATOR">Gestor de Contenidos (CONTENT_CREATOR)</option>
                  <option value="MASTER">Administrador Master (MASTER)</option>
                  <option value="SUPERADMIN">Super Admin Root (SUPERADMIN)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DEFINITIONS[formRole].shortDescription}
                </p>
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
                  </label>
                  {editingUser && (
                    <span className="text-[10px] text-slate-400">Dejar en blanco para no cambiar</span>
                  )}
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••••••' : 'Mínimo 8 caracteres'}
                    minLength={editingUser && !formPassword ? undefined : 8}
                    required={!editingUser}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Requiere mayúscula, minúscula, número y símbolo (@$!%*?&).
                </p>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-black focus:ring-black"
                />
                <label htmlFor="formIsActive" className="text-slate-700 font-medium cursor-pointer">
                  Cuenta habilitada para iniciar sesión
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="¿Eliminar usuario del sistema?"
        description={`Esta acción eliminará permanentemente la cuenta de ${deleteModal.email || 'este usuario'}. Esta operación no se puede deshacer.`}
        confirmText="Eliminar permanentemente"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
