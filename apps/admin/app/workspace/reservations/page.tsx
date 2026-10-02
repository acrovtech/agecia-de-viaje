import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyWorkspaceReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      q.set(key, value);
    }
  }
  const qStr = q.toString() ? `?${q.toString()}` : '';
  redirect(`/reservations${qStr}`);
}
