import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WorkspaceSettingsRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    }
  }
  const qs = query.toString();
  redirect(qs ? `/settings?${qs}` : '/settings');
}
