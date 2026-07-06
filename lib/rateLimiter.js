const rateLimitMap = new Map();

export function checkRateLimit(key) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 3;

  const attempts = rateLimitMap.get(key) || [];
  const recent = attempts.filter(t => now - t < windowMs);
  if (recent.length >= maxAttempts) return false;

  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

// Optional: cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  for (const [key, attempts] of rateLimitMap.entries()) {
    const recent = attempts.filter(t => now - t < windowMs);
    if (recent.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, recent);
  }
}, 60 * 1000);

export default { checkRateLimit };
