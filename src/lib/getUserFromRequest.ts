import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

type SupabaseUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
  telegram?: string | null;
  user_metadata?: {
    role?: string;
    name?: string;
    telegram?: string;
  };
};

export async function getUserFromRequest(): Promise<SupabaseUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  
  if (error || !user) return null;
  
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.email || "Unknown",
    role: user.user_metadata?.role || user.role || "PLAYER",
    telegram: user.user_metadata?.telegram || null,
    user_metadata: user.user_metadata,
  };
}

export async function getOrCreateUserFromRequest(): Promise<User | null> {
  const supaUser = await getUserFromRequest();
  if (!supaUser) return null;
  
  try {
    // First try to find by ID
    const existingUser = await prisma.user.findUnique({
      where: { id: supaUser.id }
    });

    if (existingUser) {
      // Update existing user
      return await prisma.user.update({
        where: { id: supaUser.id },
        data: {
          name: supaUser.name || supaUser.email || "Unknown",
          role: (supaUser.role || "PLAYER") as any,
          telegram: supaUser.telegram || null,
        }
      });
    }

    // If no user exists with this ID, try to find by email
    const userByEmail = await prisma.user.findUnique({
      where: { email: supaUser.email }
    });

    if (userByEmail) {
      // If a user with this email exists but has a different ID, 
      // just return that user without updating
      return userByEmail;
    }

    // If no user exists with this email, create new user
    return await prisma.user.create({
      data: {
        id: supaUser.id,
        email: supaUser.email,
        name: supaUser.name || supaUser.email || "Unknown",
        role: (supaUser.role || "PLAYER") as any,
        telegram: supaUser.telegram || null,
        password: "supabase",
      }
    });
  } catch (error) {
    console.error("Error in getOrCreateUserFromRequest:", error);
    return null;
  }
}
