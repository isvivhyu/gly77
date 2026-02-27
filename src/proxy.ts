import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, getClientIP, RATE_LIMITS } from "./lib/rateLimit";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIP(request);

  // Rate limit sitemap requests
  if (pathname === "/sitemap.xml") {
    const result = rateLimit({
      ...RATE_LIMITS.sitemap,
      identifier: `sitemap:${ip}`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.reset - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(RATE_LIMITS.sitemap.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
          },
        },
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Limit",
      String(RATE_LIMITS.sitemap.limit),
    );
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));
    return response;
  }

  // Rate limit API-like routes (if you have any)
  if (pathname.startsWith("/api/")) {
    const result = rateLimit({
      ...RATE_LIMITS.api,
      identifier: `api:${ip}`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "API rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.reset - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(RATE_LIMITS.api.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.api.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));
    return response;
  }

  // General rate limiting for all routes
  const result = rateLimit({
    ...RATE_LIMITS.general,
    identifier: `general:${ip}`,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMITS.general.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  }

  // Add rate limit headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.general.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.reset));
  return response;
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
