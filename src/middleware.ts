import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware: checks session cookie and forwards pathname to server components.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname on the request so server components can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Always allow auth routes and static files through
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/icon.svg" ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // Require session cookie for everything else
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.json|sw\\.js).*)",
  ],
};
