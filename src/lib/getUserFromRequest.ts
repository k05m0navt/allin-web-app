import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function getUserFromRequest() {
  // This assumes cookies are available in the request (Next.js API route)
  const supabase = await createSupabaseServerClient();
  // Get the session from the Supabase client
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || user.role || "PLAYER",
    ...user.user_metadata,
  };
}
