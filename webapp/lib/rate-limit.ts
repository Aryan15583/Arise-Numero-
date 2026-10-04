// In-memory sliding-window rate limiter for public write endpoints
// (orders, bookings, contact, coupon validation, admin login).
//
// This is process-local — correct and sufficient for a single Node.js
// instance, which covers most small-to-medium deployments. It does NOT
// coordinate across multiple instances/containers behind a load balancer;
// if you scale horizontally, replace this with a shared store (Redis via
// `@upstash/ratelimit` or similar) keyed the same way (ip + bucket name).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map doesn't grow unbounded under sustained traffic.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Returns true if the request should be allowed, false if it should be
 * rejected with 429. `windowMs` and `max` define "at most `max` requests per
 * `windowMs` milliseconds" per (ip, bucketName) pair.
 */
export function rateLimit(ip: string, bucketName: string, max: number, windowMs: number): boolean {
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= max) return false;
  existing.count++;
  return true;
}
