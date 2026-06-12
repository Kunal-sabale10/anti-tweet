export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * POST /api/upload
 * Body: { url: string }  ← Cloudinary secure_url after direct browser upload
 *
 * The browser uploads directly to Cloudinary using /api/upload/signature,
 * then sends us the resulting URL to validate and return.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handle JSON body (URL from direct Cloudinary upload)
    if (contentType.includes('application/json')) {
      const body = await req.json() as { url?: string };
      const { url } = body;

      if (!url || !url.startsWith('https://res.cloudinary.com/')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }

      return NextResponse.json({ success: true, url });
    }

    return NextResponse.json({ error: 'Use direct Cloudinary upload via /api/upload/signature' }, { status: 400 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
