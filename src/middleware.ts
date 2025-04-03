import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const protectedPaths = ["/admin"];
  const isPathProtected = protectedPaths.some((p) => path.startsWith(p));

  // Check for authentication token
  const token = request.cookies.get("sb-access-token");

  if (isPathProtected && !token) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
