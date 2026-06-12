export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCloudinaryConfig } from '@/lib/cloudinary';
import crypto from 'crypto';

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

    // ONLY sign folder + timestamp — no transformation in signed params.
    // Transformation via signed upload requires Cloudinary's "eager" param
    // which complicates things. We'll skip server-side crop; the image still
    // uploads fine and looks great at any size.
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    // Signature string: params sorted A→Z, joined by &, then append api_secret
    const signatureString =
      Object.entries(paramsToSign)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&') + cfg.api_secret;

    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      api_key: cfg.api_key,
      cloud_name: cfg.cloud_name,
      folder,
    });
  } catch (error) {
    console.error('Signature error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get upload credentials' },
      { status: 500 }
    );
  }
}
