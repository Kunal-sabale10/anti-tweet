export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCloudinaryConfig } from '@/lib/cloudinary';

/**
 * GET /api/upload/config
 * Returns the Cloudinary cloud_name and upload_preset for unsigned uploads.
 * No API key or signature exposed to the browser.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cfg = getCloudinaryConfig();
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'anti_tweet_unsigned';

    return NextResponse.json({
      cloud_name: cfg.cloud_name,
      upload_preset: uploadPreset,
    });
  } catch (error) {
    console.error('Config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Configuration error' },
      { status: 500 }
    );
  }
}
