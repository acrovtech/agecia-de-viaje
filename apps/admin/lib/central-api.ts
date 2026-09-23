import 'server-only';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { API_SESSION_COOKIE, isApiAdmin } from './admin-mode';

export class CentralApiError extends Error {
  constructor(public readonly status: number) { super('No se pudo completar la solicitud a la API central.'); }
}

const identitySchema = z.object({
  userId: z.string(), email: z.string().email(), agencyId: z.string(), membershipId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'OPERATOR', 'EDITOR', 'VIEWER']),
  agencyName: z.string(), agencySlug: z.string(),
});
const sessionSchema = z.object({
  accessToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/), tokenType: z.literal('Bearer'),
  expiresAt: z.string().datetime(), agencyId: z.string(),
});
export type CentralIdentity = z.infer<typeof identitySchema>;

export async function centralRequest(path: string, token?: string, body?: unknown, method?: 'POST' | 'PUT') {
  if (!isApiAdmin()) throw new CentralApiError(403);
  const origin = process.env.ADMIN_API_URL;
  if (!origin) throw new CentralApiError(503);
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || !path.startsWith('/v1/')) {
    throw new CentralApiError(503);
  }
  try {
    const response = await fetch(`${origin}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new CentralApiError(response.status);
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error instanceof CentralApiError) throw error;
    throw new CentralApiError(503);
  }
}

export async function centralLogin(email: string, password: string, agencySlug: string) {
  const parsed = sessionSchema.safeParse(await centralRequest('/v1/auth/login', undefined, { email, password, agencySlug }));
  if (!parsed.success || Date.parse(parsed.data.expiresAt) <= Date.now()) throw new CentralApiError(503);
  return parsed.data;
}

export async function centralSession() {
  const token = (await cookies()).get(API_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CentralApiError(401);
  const parsed = identitySchema.safeParse(await centralRequest('/v1/auth/me', token));
  if (!parsed.success) throw new CentralApiError(503);
  return { token, identity: parsed.data };
}

export async function centralLogout(token: string) {
  try { await centralRequest('/v1/auth/logout', token, {}); }
  catch (error) {
    if (!(error instanceof CentralApiError) || error.status !== 401) throw error;
  }
}
