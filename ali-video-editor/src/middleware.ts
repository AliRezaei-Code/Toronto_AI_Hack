/**
 * Video Copilot - Security Middleware
 *
 * Production-grade middleware for security headers and rate limiting.
 * Applied to all routes automatically by Next.js.
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General API endpoints - relaxed for local use
  default: { windowMs: 60000, maxRequests: 1000 },
  // Expensive operations - still limit to prevent accidental overload
  "/api/analyze": { windowMs: 60000, maxRequests: 60 },
  "/api/transcribe": { windowMs: 60000, maxRequests: 60 },
  "/api/insights": { windowMs: 60000, maxRequests: 60 },
  "/api/generate-description": { windowMs: 60000, maxRequests: 120 },
  // YouTube operations
  "/api/youtube/download": { windowMs: 60000, maxRequests: 30 },
  "/api/youtube/chapters": { windowMs: 60000, maxRequests: 60 },
  // Keyframe extraction (CPU intensive but local is fine)
  "/api/extract-keyframes": { windowMs: 60000, maxRequests: 60 },
  "/api/extract-audio": { windowMs: 60000, maxRequests: 60 },
};

// In-memory rate limit store (simple implementation for single-instance deployment)
// For production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Use X-Forwarded-For if behind proxy, otherwise use a hash of headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback: use user-agent + accept-language as identifier
  const ua = request.headers.get("user-agent") || "unknown";
  const lang = request.headers.get("accept-language") || "unknown";
  return `${ua.substring(0, 50)}-${lang.substring(0, 20)}`;
}

/**
 * Check rate limit for a client and path
 */
function checkRateLimit(
  clientId: string,
  pathname: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[pathname] ?? RATE_LIMITS.default;
  if (!config) {
    throw new Error(`No rate limit configuration for pathname: ${pathname}`);
  }
  const key = `${clientId}:${pathname}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Security headers to add to all responses
 */
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // XSS Protection (legacy but still useful)
  "X-XSS-Protection": "1; mode=block",

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy (disable unnecessary features)
  "Permissions-Policy":
    "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data:",
    "connect-src 'self' https://api.deepgram.com https://generativelanguage.googleapis.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Prevent DNS prefetching for privacy
  "X-DNS-Prefetch-Control": "off",
};

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check rate limit for API routes
  if (pathname.startsWith("/api/")) {
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, pathname);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateLimit.remaining)
    );
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(rateLimit.resetTime / 1000))
    );

    // Add security headers
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(header, value);
    }

    return response;
  }

  // Add security headers to non-API routes
  const response = NextResponse.next();
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
