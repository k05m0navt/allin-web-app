import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

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

export async function getOrCreateUserFromRequest() {
  const supaUser = await getUserFromRequest();
  if (!supaUser) return null;
  // Upsert into User table
  const dbUser = await prisma.user.upsert({
    where: { id: supaUser.id },
    update: {
      email: supaUser.email,
      name: supaUser.name || supaUser.email || "Unknown",
      role: supaUser.role || "PLAYER",
      telegram: supaUser.telegram || null,
    },
    create: {
      id: supaUser.id,
      email: supaUser.email,
      name: supaUser.name || supaUser.email || "Unknown",
      role: supaUser.role || "PLAYER",
      telegram: supaUser.telegram || null,
      password: "supabase",
    },
  });
  return dbUser;
}
