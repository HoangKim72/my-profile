// src/middleware.ts
// Protect dashboard routes and handle auth redirects

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { consumeRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { getClientIpFromRequest } from "@/lib/security/request";

export async function middleware(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  const pathname = request.nextUrl.pathname;

  const globalRateLimit = consumeRateLimit({
    key: `global:${ip}`,
    ...rateLimitPresets.globalRequests,
  });

  if (!globalRateLimit.allowed) {
    return buildTooManyRequestsResponse(globalRateLimit.retryAfterMs);
  }

  if (
    request.method === "POST" &&
    (pathname === "/login" || pathname === "/register")
  ) {
    const authPageRateLimit = consumeRateLimit({
      key: `auth-page:${ip}:${pathname}`,
      ...rateLimitPresets.authPagePosts,
    });

    if (!authPageRateLimit.allowed) {
      return buildTooManyRequestsResponse(authPageRateLimit.retryAfterMs);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/login", request.url)),
        request,
      );
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (user) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        request,
      );
    }
  }

  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml / robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    request.nextUrl.protocol === "https:" || forwardedProto === "https";

  if (isHttps) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

function buildTooManyRequestsResponse(retryAfterMs: number) {
  const retryAfterSeconds = Math.max(Math.ceil(retryAfterMs / 1000), 1);
  const response = new NextResponse("Too Many Requests", {
    status: 429,
  });

  response.headers.set("Retry-After", String(retryAfterSeconds));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
