interface RateLimitOptions {
  key: string;
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalRateLimitStore.__rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalRateLimitStore.__rateLimitStore) {
  globalRateLimitStore.__rateLimitStore = rateLimitStore;
}

export const rateLimitPresets = {
  authLogin: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000,
  },
  authRegister: {
    windowMs: 30 * 60 * 1000,
    maxRequests: 3,
    blockDurationMs: 30 * 60 * 1000,
  },
  globalRequests: {
    windowMs: 60 * 1000,
    maxRequests: 120,
    blockDurationMs: 5 * 60 * 1000,
  },
  authPagePosts: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 12,
    blockDurationMs: 15 * 60 * 1000,
  },
} as const;

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  cleanupRateLimitStore(now);

  const entry = rateLimitStore.get(options.key);

  if (entry && entry.blockedUntil > now) {
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      retryAfterMs: entry.blockedUntil - now,
    };
  }

  if (!entry || now - entry.windowStart >= options.windowMs) {
    rateLimitStore.set(options.key, {
      count: 1,
      windowStart: now,
      blockedUntil: 0,
    });

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(options.maxRequests - 1, 0),
      retryAfterMs: 0,
    };
  }

  entry.count += 1;

  if (entry.count > options.maxRequests) {
    const blockDurationMs = options.blockDurationMs ?? options.windowMs;

    entry.blockedUntil = now + blockDurationMs;
    rateLimitStore.set(options.key, entry);

    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      retryAfterMs: blockDurationMs,
    };
  }

  rateLimitStore.set(options.key, entry);

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: Math.max(options.maxRequests - entry.count, 0),
    retryAfterMs: 0,
  };
}

function cleanupRateLimitStore(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    const isExpiredWindow = now - entry.windowStart > 24 * 60 * 60 * 1000;
    const isExpiredBlock = entry.blockedUntil > 0 && entry.blockedUntil <= now;

    if (isExpiredWindow || isExpiredBlock) {
      rateLimitStore.delete(key);
    }
  }
}
