'use client';

import { useState, useTransition, useMemo } from 'react';
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
  RotateCcw,
  Filter,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Crown,
  Eye,
  EyeOff
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface AdminUserItem {
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showRoleMatrix, setShowRoleMatrix] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id?: string; email?: string; name?: string }>({
    isOpen: false,
  });

  // Campos de formulario
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<Role>('OPERATOR');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estadísticas agregadas
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive && (!u.lockedUntil || new Date(u.lockedUntil) < new Date())).length;
    const superAdmins = users.filter((u) => u.role === 'SUPERADMIN').length;
    const masters = users.filter((u) => u.role === 'MASTER').length;
    const operators = users.filter((u) => u.role === 'OPERATOR').length;
    const creators = users.filter((u) => u.role === 'CONTENT_CREATOR').length;
    const locked = users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;

    return { total, active, superAdmins, masters, operators, creators, locked };
  }, [users]);

  // Filtros activos
  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  // Filtrado de lista
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Búsqueda por texto
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        u.email.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query));

      // Filtro por Rol
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      // Filtro por Estado
      const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = u.isActive && !isLocked;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = !u.isActive;
      } else if (statusFilter === 'LOCKED') {
        matchesStatus = Boolean(isLocked);
      }

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Apertura de modal de creación
  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('OPERATOR');
    setFormIsActive(true);
    setShowPassword(false);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Apertura de modal de edición
  const openEditModal = (user: AdminUserItem) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email);
    setFormPassword(''); // Vacío para no sobreescribir salvo que se desee
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setShowPassword(false);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Envío del formulario
  const handleFormSubmit = (e: React.FormEvent) => {
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
          setIsFormModalOpen(false);
          setFeedback({ type: 'success', message: `Usuario ${res.user.name || res.user.email} actualizado correctamente.` });
        } else {
          setFormError(res.error || 'Error al actualizar el usuario.');
        }
      } else {
        // Creación
        if (!formPassword.trim()) {
          setFormError('La contraseña inicial es requerida para nuevos usuarios.');
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
          setIsFormModalOpen(false);
          setFeedback({ type: 'success', message: `Usuario ${res.user.name || res.user.email} registrado exitosamente.` });
        } else {
          setFormError(res.error || 'Error al registrar el usuario.');
        }
      }
    });
  };

  // Cambio de estado activo/inactivo
  const handleToggleStatus = (user: AdminUserItem) => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(user.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: res.isActive! } : u))
        );
        setFeedback({
          type: 'success',
          message: `Cuenta de ${user.name || user.email} ${res.isActive ? 'activada' : 'desactivada'} correctamente.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo modificar el estado de la cuenta.' });
      }
    });
  };

  // Desbloqueo de cuenta
  const handleUnlock = (user: AdminUserItem) => {
    startTransition(async () => {
      const res = await unlockUserAccountAction(user.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, failedLoginAttempts: 0, lockedUntil: null } : u
          )
        );
        setFeedback({ type: 'success', message: `Cuenta de ${user.name || user.email} desbloqueada exitosamente.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo desbloquear la cuenta.' });
      }
    });
  };

  // Eliminación con confirmación
  const handleDeleteConfirm = () => {
    if (!deleteModal.id) return;
    startTransition(async () => {
      const res = await deleteUserAction(deleteModal.id!);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
        setDeleteModal({ isOpen: false });
        setFeedback({ type: 'success', message: 'Usuario eliminado permanentemente del sistema.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo eliminar el usuario.' });
        setDeleteModal({ isOpen: false });
      }
    });
  };

  // Generar iniciales para avatar
  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (email || 'US').slice(0, 2).toUpperCase();
  };

  // Icono según rol
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Crown className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'MASTER':
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-800 shrink-0" />;
      case 'OPERATOR':
        return <Headset className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'CONTENT_CREATOR':
        return <PenTool className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      default:
        return <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título y Botón Primario Normalizado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">
            Usuarios y Roles
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs select-none">
            <span className="text-slate-400 font-normal">Total:</span>
            <span className="text-slate-900 font-bold">{users.length}</span>
            <span className="text-slate-500 font-medium">{users.length === 1 ? 'usuario' : 'usuarios'}</span>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="h-8 px-3.5 bg-[#0a0a0a] hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TEMPORAL DE ACCIONES */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
              : 'bg-rose-50 text-rose-800 border border-rose-200/90'
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
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. TARJETAS KPI DE RESUMEN (Estilo Shopify Polaris / Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Total Usuarios */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Usuarios
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {metrics.active} activos
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.total}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Cuentas registradas en el sistema
            </p>
          </div>
        </div>

        {/* KPI 2: Super Admin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Super Admins
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                Root / Logs
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.superAdmins}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Acceso a auditoría forense
            </p>
          </div>
        </div>

        {/* KPI 3: Master Admin */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin Master
              </span>
              <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300/80">
                Gerencia
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.masters}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Gestión general de agencia
            </p>
          </div>
        </div>

        {/* KPI 4: Operadores & Contenidos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Operaciones & Contenidos
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                {metrics.operators} Op / {metrics.creators} Cont
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.operators + metrics.creators}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Reservas, traslados y catálogo
            </p>
          </div>
        </div>

      </div>

      {/* 3. MATRIZ DE ROLES (Acordeón elegante y colapsable) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowRoleMatrix(!showRoleMatrix)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">
              Jerarquía de Roles y Privilegios del Sistema
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>{showRoleMatrix ? 'Ocultar matriz' : 'Ver permisos por rol'}</span>
            {showRoleMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showRoleMatrix && (
          <div className="p-4 border-t border-slate-100 bg-[#FAFAFA] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
            {Object.values(ROLE_DEFINITIONS).map((def) => (
              <div 
                key={def.key} 
                className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${def.badgeClass}`}>
                      {def.label}
                    </span>
                    {getRoleIcon(def.key)}
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                    {def.shortDescription}
                  </p>
                </div>
                <ul className="space-y-1 text-[10.5px] text-slate-500 border-t border-slate-100 pt-2.5">
                  {def.permissions.slice(0, 3).map((perm, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                      <span className="leading-snug">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. BARRA DE FILTROS Y BÚSQUEDA (Estilo Shopify Polaris con Custom Selects) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          
          {/* Input de Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar usuario por nombre o correo electrónico..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
            {/* Dropdown de Rol */}
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[170px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {roleFilter === 'ALL' && 'Todos los roles'}
                    {roleFilter === 'SUPERADMIN' && 'Super Admin'}
                    {roleFilter === 'MASTER' && 'Admin Master'}
                    {roleFilter === 'OPERATOR' && 'Operador'}
                    {roleFilter === 'CONTENT_CREATOR' && 'Contenidos'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>Todos los roles</span>
                    <span className="text-[11px] text-slate-400 font-normal">({users.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="SUPERADMIN" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-purple-700 font-semibold">Super Admin</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.superAdmins})</span>
                  </div>
                </SelectItem>
                <SelectItem value="MASTER" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-slate-900 font-semibold">Master Admin</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.masters})</span>
                  </div>
                </SelectItem>
                <SelectItem value="OPERATOR" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-blue-700 font-semibold">Operador</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.operators})</span>
                  </div>
                </SelectItem>
                <SelectItem value="CONTENT_CREATOR" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-emerald-700 font-semibold">Contenidos</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.creators})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dropdown de Estado */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[160px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">
                    {statusFilter === 'ALL' && 'Todos los estados'}
                    {statusFilter === 'ACTIVE' && 'Solo Activos'}
                    {statusFilter === 'INACTIVE' && 'Solo Inactivos'}
                    {statusFilter === 'LOCKED' && 'Solo Bloqueados'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[160px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <span>Todos los estados</span>
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Activos</span>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inactivos</span>
                  </div>
                </SelectItem>
                <SelectItem value="LOCKED" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Bloqueados</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Botón de Limpiar Filtros */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
                hasActiveFilters
                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer'
                  : 'text-slate-400 bg-slate-50/70 border-slate-200/80 cursor-not-allowed opacity-50'
              }`}
              title={hasActiveFilters ? 'Restablecer todos los filtros' : 'No hay filtros activos'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>

          </div>
        </div>
      </div>

      {/* 5. TABLA DE USUARIOS (Diseño Idéntico a Reservas y Tours) */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="font-semibold text-slate-600 text-sm">No se encontraron usuarios</p>
          <p className="text-xs text-slate-400 mt-1">Intenta ajustando el término de búsqueda o los filtros de rol y estado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Rol Asignado</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Último Acceso</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const roleMeta = getRoleMetadata(user.role);
                  const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();

                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Columna Usuario */}
                      <td className="px-4 py-3 text-slate-900">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[11px] shrink-0 shadow-2xs">
                            {getInitials(user.name, user.email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate leading-snug">
                              {user.name || 'Sin nombre registrado'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate leading-snug font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Columna Rol Asignado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${roleMeta.badgeClass}`}>
                          {getRoleIcon(user.role)}
                          <span>{roleMeta.label}</span>
                        </span>
                      </td>

                      {/* 3. Columna Estado */}
                      <td className="px-4 py-3">
                        {isLocked ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Bloqueado ({user.failedLoginAttempts} intentos)</span>
                          </div>
                        ) : user.isActive ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Activo</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactivo</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Columna Último Acceso */}
                      <td className="px-4 py-3 text-slate-600">
                        {user.lastLoginAt ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-800 text-[11px]">
                              {new Date(user.lastLoginAt).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {user.lastLoginIp && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                IP: {user.lastLoginIp}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Nunca ha ingresado</span>
                        )}
                      </td>

                      {/* 5. Columna Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Desbloquear cuenta si está bloqueada */}
                          {isLocked && (
                            <button
                              type="button"
                              onClick={() => handleUnlock(user)}
                              disabled={isPending}
                              title="Desbloquear cuenta de usuario"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={isPending}
                            title={user.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
                            className={`p-1.5 rounded-lg border transition-colors shadow-2xs cursor-pointer ${
                              user.isActive 
                                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200' 
                                : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            {user.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            disabled={isPending}
                            title="Editar usuario y rol"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, id: user.id, email: user.email, name: user.name || user.email })}
                            disabled={isPending}
                            title="Eliminar usuario permanentemente"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CREACIÓN Y EDICIÓN DE USUARIOS */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="text-left border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                {editingUser ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingUser ? `Editar Usuario: ${editingUser.name || editingUser.email}` : 'Registrar Nuevo Colaborador'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {editingUser
                ? 'Actualiza los datos de acceso, asigna un rol diferente o resetea la contraseña.'
                : 'Crea una nueva cuenta administrativa asignando rol y credenciales de acceso.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Nombre Completo */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Nombre y Apellidos
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Adriano Cahuana"
                className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Correo Electrónico Oficial <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ejemplo@agenciadeviajes.com"
                className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {editingUser ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña Inicial *'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Mínimo 8 caracteres seguros'}
                  className="w-full px-3 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Selector Visual de Rol */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Rol Administrativo en la Plataforma <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(ROLE_DEFINITIONS).map((def) => {
                  const isSelected = formRole === def.key;
                  return (
                    <button
                      key={def.key}
                      type="button"
                      onClick={() => setFormRole(def.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900 shadow-xs'
                          : 'border-slate-200 bg-[#FAFAFA] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${def.badgeClass}`}>
                          {def.label}
                        </span>
                        {getRoleIcon(def.key)}
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2 mt-1">
                        {def.shortDescription}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switch de Estado de Cuenta */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Estado de la Cuenta</p>
                <p className="text-[11px] text-slate-500">
                  {formIsActive ? 'El usuario podrá iniciar sesión inmediatamente.' : 'Cuenta suspendida, no podrá autenticarse.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008060]"></div>
              </label>
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-2 bg-transparent -mx-0 -mb-0 p-0">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isPending}
                className="h-8 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="h-8 px-4 bg-[#0a0a0a] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isPending && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (Usando ConfirmModal oficial) */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar usuario definitivamente?"
        description={`Esta acción revocará inmediatamente todos los tokens y eliminará de forma irreversible al usuario "${deleteModal.name}". Todas las acciones previas se mantendrán en el registro de auditoría.`}
        confirmText="Eliminar Usuario"
        cancelText="Cancelar"
        isLoading={isPending}
        variant="danger"
      />

    </div>
  );
}
