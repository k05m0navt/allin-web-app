// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function middleware(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Check if the path requires admin authentication
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isAdminPath) {
    // If no session exists, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check for admin role
    const userRole = session.user?.user_metadata?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
