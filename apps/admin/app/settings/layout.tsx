import { redirect } from 'next/navigation';
import { isApiAdmin } from '../../lib/admin-mode';
import { centralSession, CentralApiError } from '../../lib/central-api';
import { AppShell } from '../../components/design-system/app-shell';
import { SettingsSidebar } from '../../components/design-system/settings-sidebar';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({
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
            href="/settings"
            className="inline-block text-xs font-semibold underline text-slate-900"
          >
            Volver a intentar
          </a>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      identity={session.identity}
      sidebar={({ onNavigate }) => (
        <SettingsSidebar identity={session.identity} onNavigate={onNavigate} />
      )}
    >
      {children}
    </AppShell>
  );
}
