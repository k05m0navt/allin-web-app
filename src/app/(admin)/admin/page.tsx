import AdminDashboardClient from "./AdminDashboardClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

interface PlayerWithDetails {
  id: string;
  name: string;
  telegram: string;
  phone: string;
  createdAt: string;
}

interface PrismaPlayer {
  id: string;
  name: string;
  telegram: string | null;
  phone: string | null;
  createdAt: Date | string;
}

export default async function AdminDashboardPage() {
  let session: { access_token: string } | null = null;
  let dbUser: { user_metadata?: { role?: string } } | null = null;
  let transformedPlayers: PlayerWithDetails[] = [];
  let dbError: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    // Use getSession for access_token, but getUser for secure user info
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData.session;
    if (session?.access_token) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      dbUser = userData.user;
    }

    if (!dbUser || dbUser.user_metadata?.role !== "ADMIN") {
      return <div>Unauthorized</div>;
    }

    const fetchedPlayers: PrismaPlayer[] = await prisma.player.findMany({
      orderBy: { createdAt: "desc" },
    });

    transformedPlayers = fetchedPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      telegram: player.telegram ?? "",
      phone: player.phone ?? "",
      createdAt: player.createdAt instanceof Date ? player.createdAt.toISOString() : String(player.createdAt),
    }));
  } catch (error: unknown) {
    dbError = (error instanceof Error ? error.message : "Unknown error");
  }

  return <AdminDashboardClient session={session} players={transformedPlayers} dbError={dbError} />;
}
