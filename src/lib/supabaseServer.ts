"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function createSupabaseServerClient(cookieStore?: Awaited<ReturnType<typeof nextCookies>>) {
  const cookies = cookieStore || await nextCookies();

  const cookieAdapter = {
    get: (_name: string) => cookies.get(_name)?.value,
    set: () => {},
    remove: () => {},
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );
}
