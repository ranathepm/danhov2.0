/**
 * In-memory IP rate limiter. Works per warm serverless instance.
 * Sufficient to block casual abuse — doesn't require external storage.
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(
  ip: string,
  endpoint: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}
