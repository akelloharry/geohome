// Simple in-memory rate limiter for payment attempts
// For production, consider using Redis instead
const store = new Map<string, number[]>();

export const rateLimiter = {
  check: (key: string, limit: number, windowMs: number): boolean => {
    const now = Date.now();
    const attempts = store.get(key) || [];
    const recent = attempts.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= limit) {
      return false;
    }

    recent.push(now);
    store.set(key, recent);
    return true;
  }
};

export function checkRateLimit(ip: string): boolean {
  return rateLimiter.check(ip, 3, 5 * 60 * 1000); // 3 attempts per 5 minutes
}

export default rateLimiter;
