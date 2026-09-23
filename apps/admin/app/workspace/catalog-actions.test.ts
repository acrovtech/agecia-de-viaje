import { afterEach, expect, test, vi } from 'vitest';
const { session, request } = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock('../../lib/central-api', () => ({ centralSession: session, centralRequest: request, CentralApiError: class extends Error { constructor(public status: number) { super(); } } }));
import { CentralApiError } from '../../lib/central-api';
import { saveCatalogAction } from './catalog-actions';

afterEach(() => vi.resetAllMocks());
function form(kind = 'tours') {
  const data = new FormData();
  Object.entries({ kind, id: '', title: 'Title', slug: 'title', duration: '1 day', description: 'Description', bannerImage: '/banner.webp', cardImage: '/card.webp', hasSharedService: 'on', sharedPrice: '10.50' }).forEach(([key, value]) => data.set(key, value));
  return data;
}
function setup(role = 'ADMIN') {
  session.mockResolvedValue({ token: 'private-token', identity: { agencyId: 'own-agency', role } });
  request.mockResolvedValue({ id: 'new', title: 'Title', slug: 'title', duration: '1 day', description: 'Description', bannerImage: '/x', hasSharedService: true, sharedPrice: 10.5, hasPrivateService: false, updatedAt: new Date().toISOString() });
}
test('save derives agency from session and ignores injected tenant fields', async () => {
  setup();
  const data = form(); data.set('agencyId', 'foreign');
  await expect(saveCatalogAction(null, data)).rejects.toThrow('REDIRECT:/workspace?view=tours&saved=1');
  expect(request.mock.calls[0]![0]).toBe('/v1/agencies/own-agency/catalog/tours');
  expect(request.mock.calls[0]![2]).not.toHaveProperty('agencyId');
});
test.each([['VIEWER', 'tours'], ['OPERATOR', 'tours'], ['EDITOR', 'transfers']])('%s cannot mutate %s', async (role, kind) => {
  setup(role);
  expect(await saveCatalogAction(null, form(kind))).toHaveProperty('error');
  expect(request).not.toHaveBeenCalled();
});
test('update sends version and PUT instead of overwriting without precondition', async () => {
  setup(); const data = form(); data.set('id', 'record-a'); data.set('updatedAt', '2026-09-21T00:00:00.000Z');
  await expect(saveCatalogAction(null, data)).rejects.toThrow('REDIRECT:');
  expect(request.mock.calls[0]![3]).toBe('PUT');
  expect(request.mock.calls[0]![2].expectedUpdatedAt).toBe('2026-09-21T00:00:00.000Z');
});
test('conflict is displayed without retrying or redirecting', async () => {
  setup(); request.mockRejectedValue(new CentralApiError(409));
  expect((await saveCatalogAction(null, form())).error).toContain('Recarga');
  expect(request).toHaveBeenCalledOnce();
});
test('invalid record path never reaches the API', async () => {
  setup(); const data = form(); data.set('id', '../memberships');
  expect(await saveCatalogAction(null, data)).toHaveProperty('error');
  expect(request).not.toHaveBeenCalled();
});
