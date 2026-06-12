/**
 * Shared Cloudinary configuration helper.
 *
 * Priority (highest first):
 *   1. Individual vars: CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *   2. CLOUDINARY_URL  →  cloudinary://api_key:api_secret@cloud_name
 */

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  // ── Option 1 (PRIORITY): Individual environment variables ─────────────────
  // These always win over CLOUDINARY_URL to avoid parsing issues.
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key    = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret };
  }

  // ── Option 2 (FALLBACK): Parse CLOUDINARY_URL ────────────────────────────
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    // Standard format: cloudinary://api_key:api_secret@cloud_name
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      return {
        api_key:    match[1].trim(),
        api_secret: match[2].trim(),
        cloud_name: match[3].trim(),
      };
    }
    // HTTPS format: https://api_key:api_secret@api.cloudinary.com/cloud_name
    const httpsMatch = url.match(/^https?:\/\/([^:]+):([^@]+)@[^/]+\/(.+)$/);
    if (httpsMatch) {
      return {
        api_key:    httpsMatch[1].trim(),
        api_secret: httpsMatch[2].trim(),
        cloud_name: httpsMatch[3].trim(),
      };
    }
  }

  // ── Nothing worked ────────────────────────────────────────────────────────
  const missing = [
    !cloud_name  && 'CLOUDINARY_CLOUD_NAME',
    !api_key     && 'CLOUDINARY_API_KEY',
    !api_secret  && 'CLOUDINARY_API_SECRET',
  ].filter(Boolean).join(', ');

  throw new Error(
    `Cloudinary not configured. In Vercel → Settings → Environment Variables, ` +
    `add these 3 variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. ` +
    (missing ? `Currently missing: ${missing}.` : `Check values for typos or extra spaces.`)
  );
}

export async function configureCloudinary() {
  const { v2: cloudinary } = await import('cloudinary');
  const cfg = getCloudinaryConfig();
  cloudinary.config({ ...cfg, secure: true });
  return cloudinary;
}
