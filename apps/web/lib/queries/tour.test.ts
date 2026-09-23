import { afterEach, expect, test, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('@repo/db', () => ({ prisma: { tour: { findFirst } } }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  findFirst.mockReset();
});

test.each([404, 500])('API response %s never falls back to unscoped database queries', async (status) => {
  vi.stubEnv('CATALOG_SOURCE', 'api');
  vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { getTourBySlug } = await import('./tour');
  expect(await getTourBySlug('tour-b')).toBeNull();
  expect(findFirst).not.toHaveBeenCalled();
});

test('API outage never falls back to unscoped database queries', async () => {
  vi.stubEnv('CATALOG_SOURCE', 'api');
  vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { getTourBySlug } = await import('./tour');
  expect(await getTourBySlug('tour-b')).toBeNull();
  expect(findFirst).not.toHaveBeenCalled();
});

test('legacy mode remains explicit and does not call the API', async () => {
  vi.stubEnv('CATALOG_SOURCE', 'legacy');
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  findFirst.mockResolvedValue(null);
  const { getTourBySlug } = await import('./tour');
  expect(await getTourBySlug('tour-a')).toBeNull();
  expect(findFirst).toHaveBeenCalledOnce();
  expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isPublished: true }) }));
  expect(fetchMock).not.toHaveBeenCalled();
});
