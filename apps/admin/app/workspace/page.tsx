import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyWorkspacePage({
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

  if (view === 'tours') {
    redirect(`/catalog/tours${qStr}`);
  }
  if (view === 'transfers') {
    redirect(`/catalog/transfers${qStr}`);
  }
  if (view === 'members') {
    redirect(`/team${qStr}`);
  }

  redirect(`/dashboard${qStr}`);
}
