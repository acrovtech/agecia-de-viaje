import { afterEach, expect, test, vi } from 'vitest';
const { session, request } = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock('../../../lib/central-api', () => ({ centralSession: session, centralRequest: request, CentralApiError: class extends Error { constructor(public status: number) { super(); } } }));
import { CentralApiError } from '../../../lib/central-api';
import { quoteReservationAction, createReservationAction, transitionReservationAction } from './actions';

afterEach(() => vi.resetAllMocks());
const quote = { kind: 'TOUR', serviceId: 'tour-a', modality: 'shared', date: '2026-10-01', pax: 2, vehicleId: null, title: 'Tour', vehicleName: null, pricingUnit: 'PER_TRAVELER', unitPriceMinor: 1015, totalMinor: 2030, currency: 'USD', quoteHash: 'a'.repeat(64) };
function form() {
  session.mockResolvedValue({ token: 'secret-token', identity: { agencyId: 'own-agency', role: 'OPERATOR' } });
  const data = new FormData(); data.set('payload', JSON.stringify({ requestKey: 'unchanged-key' })); data.set('agencyId', 'foreign');
  return data;
}
test('quote derives tenant from current session and does not expose its token', async () => {
  const data = form(); request.mockResolvedValue(quote);
  const state = await quoteReservationAction(null, data);
  expect(state.quote).toEqual(quote); expect(JSON.stringify(state)).not.toContain('secret-token');
  expect(request.mock.calls[0]![0]).toBe('/v1/agencies/own-agency/reservations/quote');
});
test.each(['EDITOR', 'VIEWER'])('%s cannot quote, create or transition', async (role) => {
  const data = form(); data.set('id', 'reservation-a');
  session.mockResolvedValue({ identity: { agencyId: 'own-agency', role } });
  for (const action of [quoteReservationAction, createReservationAction, transitionReservationAction]) expect(await action(null, data)).toHaveProperty('error');
  expect(request).not.toHaveBeenCalled();
});
test('ambiguous create failure preserves the request key and does not retry automatically', async () => {
  const data = form(); request.mockRejectedValue(new CentralApiError(503));
  const result = await createReservationAction(null, data);
  expect(result.error).toContain('mismo envío'); expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0]![2]).toEqual({ requestKey: 'unchanged-key' });
  expect(data.get('payload')).toBe(JSON.stringify({ requestKey: 'unchanged-key' }));
});
test('quote conflict is shown before redirecting', async () => {
  const data = form(); request.mockRejectedValue(new CentralApiError(409));
  expect((await createReservationAction(null, data)).error).toContain('cotizar');
});
test.each(['{', JSON.stringify('á'.repeat(46000))])('bad JSON or large payload never reaches API', async (payload) => {
  const data = form(); data.set('payload', payload);
  expect(await createReservationAction(null, data)).toHaveProperty('error'); expect(request).not.toHaveBeenCalled();
});
test('transition uses PUT, current version and explicit note', async () => {
  const data = form();
  Object.entries({ id: 'reservation-a', expectedUpdatedAt: '2026-09-22T00:00:00.000Z', status: 'CONFIRMED', note: 'Coordinado' }).forEach(([key, value]) => data.set(key, value));
  request.mockResolvedValue({});
  await expect(transitionReservationAction(null, data)).rejects.toThrow('REDIRECT:/workspace/reservations?id=reservation-a&saved=1');
  expect(request).toHaveBeenCalledWith('/v1/agencies/own-agency/reservations/reservation-a/status', 'secret-token', { expectedUpdatedAt: '2026-09-22T00:00:00.000Z', status: 'CONFIRMED', note: 'Coordinado' }, 'PUT');
});
test('transition rejects injected paths', async () => {
  const data = form(); data.set('id', '../memberships');
  expect(await transitionReservationAction(null, data)).toHaveProperty('error'); expect(request).not.toHaveBeenCalled();
});
