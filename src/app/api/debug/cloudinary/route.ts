export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * GET /api/debug/cloudinary
 * Shows the first ~40 chars of CLOUDINARY_URL and whether individual vars are set.
 * Auth-protected — only logged-in users can see this.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.CLOUDINARY_URL || '';

  return NextResponse.json({
    CLOUDINARY_URL_set: !!url,
    CLOUDINARY_URL_preview: url ? `${url.slice(0, 40)}...` : '(not set)',
    CLOUDINARY_URL_starts_with: url.split('://')[0] || '(empty)',
    CLOUDINARY_CLOUD_NAME_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY_set: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET_set: !!process.env.CLOUDINARY_API_SECRET,
  });
}
