"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await nextCookies();

  // Adapter for Supabase SSR expected interface
  const cookieAdapter = {
    get: (_name: string) => cookieStore.get(_name)?.value,
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
