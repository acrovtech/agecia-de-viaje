'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface InvitationInfo {
  agencyName: string;
  email: string;
  role: string;
  expiresAt: string;
  isExistingUser: boolean;
}

type PageState =
  | { type: 'loading' }
  | { type: 'invalid' }
  | { type: 'ready'; info: InvitationInfo }
  | { type: 'submitting'; info: InvitationInfo }
  | { type: 'success' }
  | { type: 'error'; message: string; info: InvitationInfo };

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<PageState>({ type: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Validate and load invitation details
  useEffect(() => {
    if (!token || token.length < 10) {
      setState({ type: 'invalid' });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/invitations/${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) {
          setState({ type: 'invalid' });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setState({ type: 'ready', info: data });
        }
      } catch {
        if (!cancelled) setState({ type: 'invalid' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (state.type !== 'ready' && state.type !== 'error') return;
      const info = state.info;

      setState({ type: 'submitting', info });

      try {
        const body: Record<string, string> = { password };
        if (!info.isExistingUser && name.trim()) {
          body.name = name.trim();
        }

        const res = await fetch(
          `/api/invitations/${encodeURIComponent(token)}/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setState({
            type: 'error',
            message: err.message || 'No se pudo aceptar la invitación.',
            info,
          });
          return;
        }

        setState({ type: 'success' });
        // Redirect to login after 3 seconds
        setTimeout(() => router.push('/login'), 3000);
      } catch {
        setState({
          type: 'error',
          message: 'Error de conexión. Inténtalo nuevamente.',
          info,
        });
      }
    },
    [state, password, name, token, router],
  );

  if (state.type === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">Verificando invitación…</p>
        </div>
      </main>
    );
  }

  if (state.type === 'invalid') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Invitación no válida</h1>
          <p className="text-slate-600 text-sm">
            Este enlace de invitación no es válido, ha expirado, o ya fue utilizado.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </main>
    );
  }

  if (state.type === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">¡Membresía activada!</h1>
          <p className="text-slate-600 text-sm">
            Tu acceso ha sido configurado exitosamente. Serás redirigido al inicio de sesión.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </main>
    );
  }

  const info = state.info;
  const isSubmitting = state.type === 'submitting';
  const errorMessage = state.type === 'error' ? state.message : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Aceptar invitación
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          Has sido invitado a unirte al equipo de{' '}
          <strong className="text-slate-900">{info.agencyName}</strong> como{' '}
          <strong className="text-slate-900">{info.role}</strong>.
        </p>

        <div className="bg-slate-50 rounded-lg p-3 mb-6 text-sm text-slate-700">
          <p>
            <span className="font-medium">Correo:</span> {info.email}
          </p>
          <p>
            <span className="font-medium">Expira:</span>{' '}
            {new Date(info.expiresAt).toLocaleDateString()}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 mb-4 text-sm"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!info.isExistingUser && (
            <div>
              <label
                htmlFor="accept-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nombre completo
              </label>
              <input
                id="accept-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="accept-password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {info.isExistingUser
                ? 'Contraseña actual'
                : 'Crear contraseña'}
            </label>
            <input
              id="accept-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              placeholder={
                info.isExistingUser
                  ? 'Ingresa tu contraseña'
                  : 'Mínimo 8 caracteres'
              }
              required
              minLength={8}
              autoComplete={
                info.isExistingUser ? 'current-password' : 'new-password'
              }
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Procesando…' : 'Aceptar invitación'}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Si no esperabas esta invitación, ignora este enlace.
        </p>
      </div>
    </main>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-slate-600">Cargando…</p>
          </div>
        </main>
      }
    >
      <InvitationAcceptContent />
    </Suspense>
  );
}
