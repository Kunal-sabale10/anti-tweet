export class RateLimiter {
  private cache: Map<string, { count: number; expiresAt: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(ip: string): boolean {
    const now = Date.now();
    const record = this.cache.get(ip);

    // Cleanup stale entries randomly to prevent memory leaks in long-lived isolates
    if (Math.random() < 0.05) {
      for (const [key, val] of this.cache.entries()) {
        if (val.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }

    if (!record) {
      this.cache.set(ip, { count: 1, expiresAt: now + this.windowMs });
      return true;
    }

    if (now > record.expiresAt) {
      // Window expired, reset
      this.cache.set(ip, { count: 1, expiresAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false; // Rate limited
    }

    record.count++;
    return true;
  }
}

// Global instances for Edge environment
export const apiLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const tweetLimiter = new RateLimiter(10, 60000); // 10 tweets per minute
export const authLimiter = new RateLimiter(5, 60000); // strict: 5 auth attempts per minute

const legacyCache = new Map<string, { count: number; expiresAt: number }>();
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = legacyCache.get(key);
  if (!record || now > record.expiresAt) {
    legacyCache.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true };
  }
  if (record.count >= limit) {
    return { success: false };
  }
  record.count++;
  return { success: true };
}
