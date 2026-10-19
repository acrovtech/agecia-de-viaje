import 'server-only';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { PLATFORM_SESSION_COOKIE, isApiAdmin } from './admin-mode';
import { CentralApiError } from './central-api';

const platformAdminSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: z.string(),
});

const platformSessionResponseSchema = z.object({
  accessToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  tokenType: z.literal('Bearer'),
  expiresAt: z.string().datetime(),
  admin: platformAdminSchema,
});

const platformIdentitySchema = z.object({
  platformAdminId: z.string(),
  email: z.string().email(),
  role: z.string(),
  displayName: z.string().nullable(),
});

export type PlatformIdentity = z.infer<typeof platformIdentitySchema>;

export async function platformRequest(
  path: string,
  token?: string,
  body?: unknown,
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
) {
  if (!isApiAdmin()) throw new CentralApiError(403);
  const origin = process.env.ADMIN_API_URL;
  if (!origin) throw new CentralApiError(503);
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || !path.startsWith('/v1/platform')) {
    throw new CentralApiError(503);
  }
  try {
    const response = await fetch(`${origin}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      let serverMsg: string | undefined;
      try {
        const errJson = await response.json();
        if (typeof errJson?.message === 'string') {
          serverMsg = errJson.message;
        } else if (Array.isArray(errJson?.message)) {
          serverMsg = errJson.message.join(', ');
        }
      } catch {}
      throw new CentralApiError(response.status, serverMsg);
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error instanceof CentralApiError) throw error;
    throw new CentralApiError(503);
  }
}

export async function platformLogin(email: string, password: string) {
  const parsed = platformSessionResponseSchema.safeParse(
    await platformRequest('/v1/platform/auth/login', undefined, { email, password })
  );
  if (!parsed.success || Date.parse(parsed.data.expiresAt) <= Date.now()) {
    throw new CentralApiError(503);
  }
  return parsed.data;
}

export async function platformSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new CentralApiError(401);
  }
  const parsed = platformIdentitySchema.safeParse(
    await platformRequest('/v1/platform/auth/me', token)
  );
  if (!parsed.success) {
    throw new CentralApiError(503);
  }
  return { token, identity: parsed.data };
}

export async function platformLogout(token: string) {
  try {
    await platformRequest('/v1/platform/auth/logout', token, {});
  } catch (error) {
    if (!(error instanceof CentralApiError) || error.status !== 401) throw error;
  }
}
