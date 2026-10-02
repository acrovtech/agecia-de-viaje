import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyWorkspaceResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = typeof params.kind === 'string' ? params.kind : undefined;

  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'kind' && typeof value === 'string') {
      q.set(key, value);
    }
  }
  const qStr = q.toString() ? `?${q.toString()}` : '';

  if (kind === 'vehicles') {
    redirect(`/resources/vehicles${qStr}`);
  }

  redirect(`/resources/categories${qStr}`);
}
