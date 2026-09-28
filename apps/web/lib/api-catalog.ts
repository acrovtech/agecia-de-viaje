export interface TourCategory {
  id: string;
  name: string;
  slug: string;
}

export interface TourImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface TourItinerary {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface TourItem {
  id: string;
  content: string;
  order: number;
}

export interface TourFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface TourPrivatePrice {
  id: string;
  pax: number;
  price: number;
}

export interface ApiTourSummary {
  slug: string;
  title: string;
  description: string;
  duration: string;
  cardImage: string;
  region: string | null;
  hasSharedService: boolean;
  hasPrivateService: boolean;
  sharedPrice: number | null;
  currency: 'USD';
}

export interface ApiTourDetail extends ApiTourSummary {
  id: string;
  bannerImage: string | null;
  altitude: string | null;
  transport: string | null;
  groupSize: string | null;
  difficulty: string | null;
  mapImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  categories: TourCategory[];
  images: TourImage[];
  itineraries: TourItinerary[];
  inclusions: TourItem[];
  exclusions: TourItem[];
  recommendations: TourItem[];
  faqs: TourFaq[];
  privatePricing: TourPrivatePrice[];
}

export interface ApiTransferVehicleOption {
  id: string;
  vehicleCode: string;
  vehicleName: string;
  subtitle: string | null;
  maxPax: number;
  maxLuggage: number;
  image: string;
  price: number;
  features: string[];
}

export interface ApiTransferSummary {
  id: string;
  slug: string;
  title: string;
  origin: string;
  destination: string;
  duration: string;
  tripType: string;
  description: string | null;
  bannerImage: string | null;
  hasSharedService: boolean;
  sharedPrice: number | null;
  hasPrivateService: boolean;
  vehicleOptions: ApiTransferVehicleOption[];
  currency: 'USD';
}

function getApiBaseUrl(): string {
  const url = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: API_INTERNAL_URL o NEXT_PUBLIC_API_URL es obligatorio en producción');
    }
    return 'http://127.0.0.1:3002';
  }
  return url;
}

function getStorefrontSlug(): string {
  const slug = process.env.STOREFRONT_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (!slug) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIG_ERROR: STOREFRONT_SLUG o NEXT_PUBLIC_AGENCY_SLUG es obligatorio en producción');
    }
    return 'incabound';
  }
  return slug;
}

/**
 * Cliente de Catálogo para la API central NestJS.
 * Garantiza consumo desacoplado mediante HTTP/OpenAPI con tipado estricto.
 */
export const apiCatalog = {
  isEnabled(): boolean {
    return process.env.CATALOG_SOURCE === 'api';
  },
  getApiUrl(): string {
    return getApiBaseUrl();
  },

  getStorefront(): string {
    return getStorefrontSlug();
  },

  async getTourBySlug(slug: string): Promise<ApiTourDetail | null> {
    if (!slug) return null;
    const cleanSlug = encodeURIComponent(slug.trim().toLowerCase());
    const baseUrl = getApiBaseUrl();
    const storefront = getStorefrontSlug();
    try {
      const res = await fetch(`${baseUrl}/v1/storefronts/${encodeURIComponent(storefront)}/tours/${cleanSlug}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        console.warn(`[apiCatalog] Failed to fetch tour "${cleanSlug}", status: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn(`[apiCatalog] Network error reaching API at ${baseUrl}:`, err);
      return null;
    }
  },

  async getTours(page = 1, limit = 20): Promise<{ data: ApiTourSummary[]; hasMore: boolean }> {
    const baseUrl = getApiBaseUrl();
    const storefront = getStorefrontSlug();
    try {
      const res = await fetch(`${baseUrl}/v1/storefronts/${encodeURIComponent(storefront)}/tours?page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return { data: [], hasMore: false };
      const body = await res.json();
      return {
        data: body.data || [],
        hasMore: Boolean(body.pagination?.hasMore),
      };
    } catch (err) {
      console.warn(`[apiCatalog] Network error reaching API at ${baseUrl}:`, err);
      return { data: [], hasMore: false };
    }
  },

  async getTransfers(page = 1, limit = 50): Promise<ApiTransferSummary[]> {
    const baseUrl = getApiBaseUrl();
    const storefront = getStorefrontSlug();
    try {
      const res = await fetch(`${baseUrl}/v1/storefronts/${encodeURIComponent(storefront)}/transfers?page=${page}&limit=${limit}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const body = await res.json();
      return body.data || [];
    } catch (err) {
      console.warn(`[apiCatalog] Network error reaching API at ${baseUrl}:`, err);
      return [];
    }
  },

  async getTransferBySlug(slug: string): Promise<ApiTransferSummary | null> {
    if (!slug) return null;
    const cleanSlug = encodeURIComponent(slug.trim().toLowerCase());
    const baseUrl = getApiBaseUrl();
    const storefront = getStorefrontSlug();
    try {
      const res = await fetch(`${baseUrl}/v1/storefronts/${encodeURIComponent(storefront)}/transfers/${cleanSlug}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn(`[apiCatalog] Network error reaching API at ${baseUrl}:`, err);
      return null;
    }
  },
};
