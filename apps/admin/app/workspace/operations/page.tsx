import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyWorkspaceOperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = typeof params.view === 'string' ? params.view : undefined;

  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'view' && typeof value === 'string') {
      q.set(key, value);
    }
  }
  const qStr = q.toString() ? `?${q.toString()}` : '';

  if (view === 'fleet') {
    redirect(`/resources/fleet${qStr}`);
  }
  if (view === 'personnel') {
    redirect(`/resources/personnel${qStr}`);
  }

  redirect(`/operations${qStr}`);
}
