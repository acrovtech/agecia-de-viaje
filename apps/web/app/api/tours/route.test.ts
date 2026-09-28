import { afterEach, describe, expect, it, vi } from 'vitest';

const agencies = [
  { id: 'agency-a-id', slug: 'agency-a', isActive: true },
  { id: 'agency-b-id', slug: 'agency-b', isActive: true },
];

const tours = [
  {
    id: 'tour-a-id',
    agencyId: 'agency-a-id',
    slug: 'machu-picchu',
    title: 'Machu Picchu Agency A',
    isPublished: true,
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
    categories: [{ id: 'cat-b-id', name: 'Category Agency B' }],
    privatePricing: [],
    createdAt: new Date('2026-01-02'),
  },
];

const categories = [
  { id: 'cat-a-id', agencyId: 'agency-a-id', name: 'Category Agency A' },
  { id: 'cat-b-id', agencyId: 'agency-b-id', name: 'Category Agency B' },
];

vi.mock('@repo/db', () => ({
  prisma: {
    agency: {
      findUnique: vi.fn(async ({ where }) => {
        return agencies.find((a) => a.slug === where.slug && (where.isActive === undefined || a.isActive === where.isActive)) || null;
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
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Legacy /api/tours Cross-Tenant Isolation', () => {
  it('when storefront is Agency A, detail returns Agency A record only for identical slug', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours?slug=machu-picchu');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tour).toBeDefined();
    expect(data.tour.id).toBe('tour-a-id');
    expect(data.tour.title).toBe('Machu Picchu Agency A');
    expect(data.tour.agencyId).toBe('agency-a-id');
  });

  it('when storefront is Agency B, detail returns Agency B record only for identical slug', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'agency-b');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours?slug=machu-picchu');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tour).toBeDefined();
    expect(data.tour.id).toBe('tour-b-id');
    expect(data.tour.title).toBe('Machu Picchu Agency B');
    expect(data.tour.agencyId).toBe('agency-b-id');
  });

  it('when storefront is Agency A, listing returns only Agency A tours and categories', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tours).toHaveLength(1);
    expect(data.tours[0].id).toBe('tour-a-id');
    expect(data.tours[0].agencyId).toBe('agency-a-id');

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].id).toBe('cat-a-id');
    expect(data.categories[0].agencyId).toBe('agency-a-id');
  });

  it('when storefront is Agency B, listing returns only Agency B tours and categories', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'agency-b');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tours).toHaveLength(1);
    expect(data.tours[0].id).toBe('tour-b-id');
    expect(data.tours[0].agencyId).toBe('agency-b-id');

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].id).toBe('cat-b-id');
    expect(data.categories[0].agencyId).toBe('agency-b-id');
  });

  it('caller cannot override agency via query parameter (tenant injection resistant)', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'agency-a');
    const { GET } = await import('./route');

    // Attacker tries to inject agencyId=agency-b-id
    const req = new Request('http://localhost:3000/api/tours?slug=machu-picchu&agencyId=agency-b-id');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    // Must strictly return Agency A because server-authoritative STOREFRONT_SLUG is agency-a
    expect(data.tour.id).toBe('tour-a-id');
    expect(data.tour.agencyId).toBe('agency-a-id');
  });

  it('in production, fails closed with 500 when STOREFRONT_SLUG is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STOREFRONT_SLUG', '');
    vi.stubEnv('NEXT_PUBLIC_AGENCY_SLUG', '');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('fails with 404 when configured agency does not exist', async () => {
    vi.stubEnv('STOREFRONT_SLUG', 'unknown-agency');
    const { GET } = await import('./route');

    const req = new Request('http://localhost:3000/api/tours');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
