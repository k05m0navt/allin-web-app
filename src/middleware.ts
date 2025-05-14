// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function middleware(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Use getUser for secure, authenticated user info
  const { data: { user }, error } = await supabase.auth.getUser();

  // Check if the path requires admin authentication
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isAdminPath) {
    // If no user exists or error, redirect to login
    if (!user || error) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check for admin role
    const userRole = user.user_metadata?.role || user.role;
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
