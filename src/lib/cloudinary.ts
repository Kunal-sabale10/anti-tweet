/**
 * Shared Cloudinary configuration helper.
 * Supports multiple ways the credentials can be provided:
 *   1. CLOUDINARY_URL  →  cloudinary://api_key:api_secret@cloud_name
 *   2. Individual vars →  CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 */

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  // ── Option 1: CLOUDINARY_URL ──────────────────────────────────────────────
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    // Format: cloudinary://api_key:api_secret@cloud_name
    // api_key and api_secret may contain letters, numbers, hyphens etc.
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      return {
        api_key: match[1].trim(),
        api_secret: match[2].trim(),
        cloud_name: match[3].trim(),
      };
    }
    // Maybe it's a HTTPS URL: https://api_key:api_secret@api.cloudinary.com/cloud_name
    const httpsMatch = url.match(/^https?:\/\/([^:]+):([^@]+)@[^/]+\/(.+)$/);
    if (httpsMatch) {
      return {
        api_key: httpsMatch[1].trim(),
        api_secret: httpsMatch[2].trim(),
        cloud_name: httpsMatch[3].trim(),
      };
    }
    console.warn(`[Cloudinary] Could not parse CLOUDINARY_URL: "${url.slice(0, 30)}...". Trying individual env vars.`);
  }

  // ── Option 2: Individual environment variables ────────────────────────────
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret };
  }

  // ── Nothing worked — give a helpful error ─────────────────────────────────
  const missingUrl = !url ? 'CLOUDINARY_URL is not set.' : `CLOUDINARY_URL could not be parsed (value starts with: "${url?.slice(0, 40)}").`;
  const missingVars = [
    !cloud_name && 'CLOUDINARY_CLOUD_NAME',
    !api_key && 'CLOUDINARY_API_KEY',
    !api_secret && 'CLOUDINARY_API_SECRET',
  ].filter(Boolean).join(', ');

  throw new Error(
    `Cloudinary is not configured. ${missingUrl}` +
    (missingVars ? ` Also missing: ${missingVars}.` : '') +
    ` Set CLOUDINARY_URL or the three individual vars in Vercel → Settings → Environment Variables.`
  );
}

export async function configureCloudinary() {
  const { v2: cloudinary } = await import('cloudinary');
  const cfg = getCloudinaryConfig();
  cloudinary.config({ ...cfg, secure: true });
  return cloudinary;
}
