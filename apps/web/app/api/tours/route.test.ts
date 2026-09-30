import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const agencies = [
  { id: 'agency-a-id', slug: 'agency-a', subdomain: 'agency-a', customDomain: 'www.agency-a.com', isActive: true },
  { id: 'agency-b-id', slug: 'agency-b', subdomain: 'agency-b', customDomain: 'www.agency-b.com', isActive: true },
  { id: 'agency-unpub-id', slug: 'agency-unpub', subdomain: 'agency-unpub', customDomain: 'www.unpublished.com', isActive: true },
  { id: 'agency-inactive-id', slug: 'agency-inactive', subdomain: 'agency-inactive', customDomain: 'www.inactive.com', isActive: false },
];

const tours = [
  {
    id: 'tour-a-id',
    agencyId: 'agency-a-id',
    slug: 'machu-picchu',
    title: 'Machu Picchu Agency A',
    isPublished: true,
    region: 'Cusco',
    menuGroup: 'Full Day',
    categories: [{ id: 'cat-a-id', name: 'Category Agency A' }],
    privatePricing: [],
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'tour-b-id',
    agencyId: 'agency-b-id',
    slug: 'machu-picchu',
    title: 'Machu Picchu Agency B',
    isPublished: true,
    region: 'Cusco',
    menuGroup: 'Full Day',
    categories: [{ id: 'cat-b-id', name: 'Category Agency B' }],
    privatePricing: [],
    createdAt: new Date('2026-01-02'),
  },
];

const categories = [
  { id: 'cat-a-id', agencyId: 'agency-a-id', name: 'Category Agency A' },
  { id: 'cat-b-id', agencyId: 'agency-b-id', name: 'Category Agency B' },
];

vi.mock('@repo/db', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    prisma: {
      agency: {
        findUnique: vi.fn(async ({ where }) => {
          return agencies.find((a) => a.slug === where.slug && (where.isActive === undefined || a.isActive === where.isActive)) || null;
        }),
        findFirst: vi.fn(async ({ where }) => {
          return agencies.find((a) => {
            if (where.customDomain && a.customDomain !== where.customDomain) return false;
            if (where.subdomain && a.subdomain !== where.subdomain) return false;
            if (where.slug && a.slug !== where.slug) return false;
            if (where.isActive !== undefined && a.isActive !== where.isActive) return false;
            return true;
          }) || null;
        }),
      },
      tour: {
        findFirst: vi.fn(async ({ where }) => {
          return tours.find((t) => {
            if (where.agencyId && t.agencyId !== where.agencyId) return false;
            if (where.slug && t.slug !== where.slug) return false;
            if (where.isPublished !== undefined && t.isPublished !== where.isPublished) return false;
            return true;
          }) || null;
        }),
        findMany: vi.fn(async ({ where }) => {
          return tours.filter((t) => {
            if (where.agencyId && t.agencyId !== where.agencyId) return false;
            if (where.isPublished !== undefined && t.isPublished !== where.isPublished) return false;
            return true;
          });
        }),
      },
      category: {
        findMany: vi.fn(async ({ where }) => {
          return categories.filter((c) => {
            if (where.agencyId && c.agencyId !== where.agencyId) return false;
            return true;
          });
        }),
      },
    },
  };
});

let mockRequestHeaders: Headers | null = null;
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => mockRequestHeaders || new Headers()),
}));

// Central resolution mock mapping
function setupCentralApiFetchMock() {
  const mockFetch = vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/v1/storefront-resolution')) {
      const parsed = new URL(urlStr);
      const host = parsed.searchParams.get('host');
      if (host === 'www.agency-a.com' || host === 'agency-a.platform.example') {
        return new Response(JSON.stringify({
          slug: 'agency-a',
          name: 'Agency A',
          subdomain: 'agency-a',
          customDomain: 'www.agency-a.com',
          canonicalHost: 'www.agency-a.com',
          canonicalOrigin: 'https://www.agency-a.com',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (host === 'www.agency-b.com' || host === 'agency-b.platform.example') {
        return new Response(JSON.stringify({
          slug: 'agency-b',
          name: 'Agency B',
          subdomain: 'agency-b',
          customDomain: 'www.agency-b.com',
          canonicalHost: 'www.agency-b.com',
          canonicalOrigin: 'https://www.agency-b.com',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      // Unknown host, unpublished host (not in API_PUBLIC_AGENCY_SLUGS), or inactive agency: returns 404
      return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found' }), { status: 404 });
    }
    return new Response(null, { status: 404 });
  });

  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

beforeEach(() => {
  vi.stubEnv('API_INTERNAL_URL', 'http://127.0.0.1:3002');
  setupCentralApiFetchMock();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Dynamic Storefront & Domain Resolution Web Suite (Phase 2.5)', () => {
  it('1. Production unknown Host with STOREFRONT_SLUG=agency-a returns 404 and NEVER Agency A data', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
    const { GET } = await import('./route');

    const req = new Request('https://unknown-tenant.com/api/tours', {
      headers: { host: 'unknown-tenant.com' },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.tour).toBeUndefined();
    expect(data.tours).toBeUndefined();
  });

  it('2. Production unknown Host with NEXT_PUBLIC_AGENCY_SLUG=agency-a returns 404', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AGENCY_SLUG', 'agency-a');
    const { GET } = await import('./route');

    const req = new Request('https://unknown-tenant.com/api/tours', {
      headers: { host: 'unknown-tenant.com' },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('3. Active Agency excluded from API_PUBLIC_AGENCY_SLUGS fails closed with 404 on /api/tours and /api/tours/menu', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { GET: getTours } = await import('./route');
    const { GET: getMenu } = await import('./menu/route');

    const reqTours = new Request('https://www.unpublished.com/api/tours', {
      headers: { host: 'www.unpublished.com' },
    });
    const resTours = await getTours(reqTours);
    expect(resTours.status).toBe(404);

    const reqMenu = new Request('https://www.unpublished.com/api/tours/menu', {
      headers: { host: 'www.unpublished.com' },
    });
    const resMenu = await getMenu(reqMenu);
    expect(resMenu.status).toBe(404);
  });

  it('4. Inactive agency domain returns 404 on legacy web routes', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { GET: getTours } = await import('./route');
    const { GET: getMenu } = await import('./menu/route');

    const reqTours = new Request('https://www.inactive.com/api/tours', {
      headers: { host: 'www.inactive.com' },
    });
    const resTours = await getTours(reqTours);
    expect(resTours.status).toBe(404);

    const reqMenu = new Request('https://www.inactive.com/api/tours/menu', {
      headers: { host: 'www.inactive.com' },
    });
    const resMenu = await getMenu(reqMenu);
    expect(resMenu.status).toBe(404);
  });

  it('5. Published Agency A domain resolves to Agency A data only', async () => {
    const { GET } = await import('./route');

    const req = new Request('https://www.agency-a.com/api/tours', {
      headers: { host: 'www.agency-a.com' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tours).toHaveLength(1);
    expect(data.tours[0].id).toBe('tour-a-id');
    expect(data.tours[0].agencyId).toBe('agency-a-id');
    expect(data.categories[0].agencyId).toBe('agency-a-id');
  });

  it('6. Published Agency B domain resolves to Agency B data only', async () => {
    const { GET } = await import('./route');

    const req = new Request('https://www.agency-b.com/api/tours', {
      headers: { host: 'www.agency-b.com' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tours).toHaveLength(1);
    expect(data.tours[0].id).toBe('tour-b-id');
    expect(data.tours[0].agencyId).toBe('agency-b-id');
    expect(data.categories[0].agencyId).toBe('agency-b-id');
  });

  it('7. Same tour slug across distinct hostnames provides strict isolation', async () => {
    const { GET } = await import('./route');

    const reqA = new Request('https://www.agency-a.com/api/tours?slug=machu-picchu', {
      headers: { host: 'www.agency-a.com' },
    });
    const resA = await GET(reqA);
    expect(resA.status).toBe(200);
    const dataA = await resA.json();
    expect(dataA.tour.id).toBe('tour-a-id');
    expect(dataA.tour.title).toBe('Machu Picchu Agency A');

    const reqB = new Request('https://agency-b.platform.example/api/tours?slug=machu-picchu', {
      headers: { host: 'agency-b.platform.example' },
    });
    const resB = await GET(reqB);
    expect(resB.status).toBe(200);
    const dataB = await resB.json();
    expect(dataB.tour.id).toBe('tour-b-id');
    expect(dataB.tour.title).toBe('Machu Picchu Agency B');
  });

  it('8. Spoofed X-Forwarded-Host cannot switch tenant by default', async () => {
    const { GET } = await import('./route');

    const req = new Request('https://www.agency-a.com/api/tours?slug=machu-picchu', {
      headers: {
        host: 'www.agency-a.com',
        'x-forwarded-host': 'www.agency-b.com',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tour.id).toBe('tour-a-id');
    expect(data.tour.agencyId).toBe('agency-a-id');
  });

  it('9. Reservation action with unknown production Host fails closed without submitting under fallback tenant', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');

    mockRequestHeaders = new Headers({ host: 'unknown-host.com' });

    const { createReservationAndPaymentToken } = await import('../../actions/reservation');

    const payload = {
      tourSlug: 'machu-picchu',
      date: '2026-10-15',
      pax: 2,
      customerFirstName: 'Juan',
      customerLastName: 'Perez',
      customerEmail: 'juan@example.com',
      customerPhone: '+51999999999',
    };

    const result = await createReservationAndPaymentToken(payload);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('10. apiCatalog with unknown production Host fails closed without fallback slug', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
    vi.stubEnv('NEXT_PUBLIC_AGENCY_SLUG', 'agency-a');

    mockRequestHeaders = new Headers({ host: 'unknown-host.com' });

    const { apiCatalog } = await import('../../../lib/api-catalog');

    await expect(apiCatalog.getStorefront()).rejects.toThrow(/STOREFRONT_NOT_FOUND/);
  });
});
