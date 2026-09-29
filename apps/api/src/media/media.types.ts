export const MEDIA_KINDS = [
  'AGENCY_LOGO',
  'AGENCY_ICON',
  'TOUR_BANNER',
  'TOUR_CARD',
  'TOUR_GALLERY',
  'TRANSFER',
  'VEHICLE',
  'BLOG',
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_FOLDER_MAP: Record<MediaKind, string> = {
  AGENCY_LOGO: 'agency-logo',
  AGENCY_ICON: 'agency-icon',
  TOUR_BANNER: 'tour-banner',
  TOUR_CARD: 'tour-card',
  TOUR_GALLERY: 'tour-gallery',
  TRANSFER: 'transfers',
  VEHICLE: 'vehicles',
  BLOG: 'blogs',
};

export const MAX_MEDIA_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MiB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
