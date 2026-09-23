import { afterEach, expect, test, vi } from 'vitest';
const { session, request } = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock('../../../lib/central-api', () => ({ centralSession: session, centralRequest: request, CentralApiError: class extends Error { constructor(public status: number) { super(); } } }));
import { CentralApiError } from '../../../lib/central-api';
import { catalogContentAction } from './actions';

afterEach(() => vi.resetAllMocks());
function form(kind = 'tours', operation = 'publication', id = 'record-a') {
  session.mockResolvedValue({ token: 'private-token', identity: { agencyId: 'own-agency', role: 'ADMIN' } });
  request.mockResolvedValue({});
  const data = new FormData();
  Object.entries({ kind, operation, id, payload: JSON.stringify({ expectedUpdatedAt: '2026-09-21T00:00:00.000Z', isPublished: true }), agencyId: 'foreign' }).forEach(([key, value]) => data.set(key, value));
  return data;
}
test('publication derives agency from session and forwards the explicit version', async () => {
  const data = form();
  await expect(catalogContentAction(null, data)).rejects.toThrow('REDIRECT:/workspace/content?kind=tours&id=record-a&saved=1');
  expect(request).toHaveBeenCalledWith('/v1/agencies/own-agency/catalog/tours/record-a/publication', 'private-token', { expectedUpdatedAt: '2026-09-21T00:00:00.000Z', isPublished: true }, 'PUT');
});
test.each([['VIEWER', 'tours'], ['OPERATOR', 'categories'], ['EDITOR', 'vehicles']])('%s cannot write %s', async (role, kind) => {
  const data = form(kind, kind === 'tours' ? 'content' : 'resource');
  session.mockResolvedValue({ identity: { agencyId: 'own-agency', role } });
  expect((await catalogContentAction(null, data)).error).toContain('rol');
  expect(request).not.toHaveBeenCalled();
});
test.each([['categories', 'publication', 'a'], ['tours', 'resource', 'a'], ['tours', 'content', '../memberships'], ['tours', 'delete', 'a'], ['tours', 'content', '']])('invalid route combination %s/%s/%s is rejected', async (kind, operation, id) => {
  expect((await catalogContentAction(null, form(kind, operation, id))).error).toContain('inválida');
  expect(request).not.toHaveBeenCalled();
});
test.each(['{', JSON.stringify('á'.repeat(46000))])('invalid or oversized payload never reaches Nest', async (payload) => {
  const data = form(); data.set('payload', payload);
  expect(await catalogContentAction(null, data)).toHaveProperty('error');
  expect(request).not.toHaveBeenCalled();
});
test('resource creation uses the scoped collection', async () => {
  const data = form('categories', 'resource', ''); data.set('payload', JSON.stringify({ name: 'Nature', slug: 'nature' }));
  await expect(catalogContentAction(null, data)).rejects.toThrow('REDIRECT:/workspace/resources?kind=categories&saved=1');
  expect(request).toHaveBeenCalledWith('/v1/agencies/own-agency/catalog/categories', 'private-token', { name: 'Nature', slug: 'nature' }, 'POST');
});
test('conflict does not retry or redirect', async () => {
  const data = form(); request.mockRejectedValue(new CentralApiError(409));
  expect((await catalogContentAction(null, data)).error).toContain('Recarga');
  expect(request).toHaveBeenCalledOnce();
});
