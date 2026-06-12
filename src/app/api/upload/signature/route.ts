export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCloudinaryConfig } from '@/lib/cloudinary';
import crypto from 'crypto';

/**
 * GET /api/upload/signature
 * Returns a signed Cloudinary upload signature so the browser can
 * upload directly to Cloudinary without routing the file through Vercel.
 *
 * This is the production-grade approach — zero server memory pressure,
 * no base64 encoding issues, no Vercel timeout on large files.
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'anti_tweet_uploads';

    const cfg = getCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);

    // Build the params to sign (must be sorted alphabetically)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    // Add avatar-specific transformation if uploading a profile photo
    if (folder === 'anti_tweet_avatars') {
      paramsToSign.transformation = 'c_fill,g_face,h_400,w_400/q_auto,f_auto';
    }

    // Create the signature string: key=value pairs sorted alphabetically, joined by &
    const signatureString = Object.entries(paramsToSign)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    // SHA-1 HMAC of the string + api_secret
    const signature = crypto
      .createHash('sha1')
      .update(signatureString + cfg.api_secret)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      api_key: cfg.api_key,
      cloud_name: cfg.cloud_name,
      folder,
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
