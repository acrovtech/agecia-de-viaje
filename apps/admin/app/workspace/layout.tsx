import { redirect } from 'next/navigation';
import { isApiAdmin } from '../../lib/admin-mode';
import { centralSession, CentralApiError } from '../../lib/central-api';
import { AppShell } from '../../components/design-system/app-shell';

export const dynamic = 'force-dynamic';

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isApiAdmin()) {
    redirect('/');
  }

  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    // If central API is temporarily unavailable, show quiet fallback
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h1 className="text-lg font-bold text-slate-900">
            No pudimos verificar tu sesión
          </h1>
          <p className="text-sm text-slate-600">
            El servicio de autenticación central no está disponible en este momento.
          </p>
          <a
            href="/workspace"
            className="inline-block text-xs font-semibold underline text-slate-900"
          >
            Volver a intentar
          </a>
        </div>
      </div>
    );
  }

  return <AppShell identity={session.identity}>{children}</AppShell>;
}
