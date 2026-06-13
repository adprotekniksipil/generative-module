// Simple in-memory rate limiter (no external dependencies)
// Suitable for single-process deployments (VPS with PM2 single instance)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitConfig {
  /** Unique name for this limiter */
  name: string;
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  if (!stores.has(config.name)) {
    stores.set(config.name, new Map());
  }

  return {
    check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
      const store = stores.get(config.name)!;
      const now = Date.now();

      // Clean expired entries periodically (every 100 checks)
      if (Math.random() < 0.01) {
        for (const [k, v] of store) {
          if (v.resetAt < now) store.delete(k);
        }
      }

      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowSeconds * 1000 };
      }

      entry.count++;
      if (entry.count > config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
    },
  };
}

// Pre-configured limiters
export const authLimiter = createRateLimiter({
  name: "auth",
  maxRequests: 10,
  windowSeconds: 60, // 10 attempts per minute
});

export const apiLimiter = createRateLimiter({
  name: "api",
  maxRequests: 60,
  windowSeconds: 60, // 60 requests per minute
});

export const generateLimiter = createRateLimiter({
  name: "generate",
  maxRequests: 10,
  windowSeconds: 60, // 10 AI generations per minute
});

// Helper to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// Helper to return 429 response
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi nanti." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
