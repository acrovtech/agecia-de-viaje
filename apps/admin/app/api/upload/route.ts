import { NextResponse } from 'next/server';

/**
 * Legacy upload route - Permanently Disabled in Phase 2.3.
 *
 * All uploads must go through the authoritative central SaaS API:
 * POST /v1/agencies/:agencyId/media
 * with tenant-authenticated session token and role authorization.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Legacy upload route is permanently disabled. Use central API media endpoints (/v1/agencies/:agencyId/media).',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Legacy upload route is permanently disabled. Use central API media endpoints (/v1/agencies/:agencyId/media).',
    },
    { status: 410 }
  );
}
