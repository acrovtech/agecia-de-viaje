/**
 * Legacy R2 utilities - DEPRECATED in Phase 2.3.
 *
 * Direct uploads from Next.js admin are deprecated and fail closed.
 * All media operations must use the authoritative central NestJS API:
 * POST /v1/agencies/:agencyId/media
 * which enforces tenant boundaries, MIME/magic byte verification, and audit logging.
 */

export function isR2Configured(): boolean {
  return false;
}

export async function uploadToR2(
  _fileBuffer: Buffer,
  _fileName: string,
  _contentType: string,
  _folder: string = 'assets'
): Promise<{ success: boolean; url: string; error?: string }> {
  // Never return fake success or fake /uploads/... URLs
  return {
    success: false,
    url: '',
    error: 'Direct upload via legacy admin is permanently disabled. Use central SaaS API.',
  };
}
