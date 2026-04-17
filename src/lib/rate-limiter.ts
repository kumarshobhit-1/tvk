// src/lib/rate-limiter.ts
/**
 * Rate Limiting for API endpoints to handle high concurrency
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  message: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * In-memory rate limiter
 * Note: For production with multiple servers, use Redis
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get client identifier (IP or user ID)
   */
  private getClientId(
    request: Request | { headers: { get: (name: string) => string | null } }
  ): string {
    const headers = request.headers;
    return (
      headers.get('x-forwarded-for') ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(
    request: Request | { headers: { get: (name: string) => string | null } }
  ): boolean {
    const clientId = this.getClientId(request);
    const now = Date.now();

    if (!store[clientId]) {
      store[clientId] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return true;
    }

    const entry = store[clientId];

    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + this.config.windowMs;
      return true;
    }

    // Check if under limit
    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for client
   */
  getRemaining(
    request: Request | { headers: { get: (name: string) => string | null } }
  ): number {
    const clientId = this.getClientId(request);
    const entry = store[clientId];

    if (!entry) return this.config.maxRequests;

    const remaining = Math.max(
      0,
      this.config.maxRequests - entry.count
    );

    return remaining;
  }

  /**
   * Get reset time for client
   */
  getResetTime(
    request: Request | { headers: { get: (name: string) => string | null } }
  ): number {
    const clientId = this.getClientId(request);
    const entry = store[clientId];

    if (!entry) return Date.now() + this.config.windowMs;

    return entry.resetTime;
  }

  /**
   * Cleanup old entries
   */
  private cleanup() {
    const now = Date.now();
    for (const clientId in store) {
      if (now > store[clientId].resetTime + this.config.windowMs) {
        delete store[clientId];
      }
    }
  }
}

/**
 * Predefined rate limit configs
 */
export const RATE_LIMITS = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  },
  // Auth endpoints (strict)
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,             // 5 attempts per 15 min
    message: 'Too many login attempts, please try again later',
  },
  // Exam submission (moderate)
  examSubmit: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 20,            // 20 submissions per hour
    message: 'Exam submission limit exceeded',
  },
  // File upload (strict)
  fileUpload: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,            // 10 uploads per hour
    message: 'File upload limit exceeded',
  },
  // Read operations (lenient)
  read: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 300,           // 300 reads per minute
    message: 'Too many read requests',
  },
} as const;

/**
 * Middleware for API routes
 */
export function getRateLimitMiddleware(
  config: RateLimitConfig = RATE_LIMITS.general
) {
  const limiter = new RateLimiter(config);

  return function (handler: Function) {
    return async (request: Request, ...args: any[]) => {
      if (!limiter.isAllowed(request)) {
        const resetTime = limiter.getResetTime(request);
        return new Response(
          JSON.stringify({
            error: config.message,
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': String(limiter.getRemaining(request)),
              'X-RateLimit-Reset': String(resetTime),
            },
          }
        );
      }

      // Add rate limit headers to response
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set(
          'X-RateLimit-Remaining',
          String(limiter.getRemaining(request))
        );
        response.headers.set(
          'X-RateLimit-Reset',
          String(limiter.getResetTime(request))
        );
      }

      return response;
    };
  };
}
