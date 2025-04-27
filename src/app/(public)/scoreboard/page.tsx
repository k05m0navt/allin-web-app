// Removed 'use client' directive to make this a server component

import { ScoreboardTable } from "@/components/Scoreboard/ScoreboardTable";
import { prisma } from "@/lib/prisma";

export default async function ScoreboardPage() {
  // Fetch all players with their statistics (adjust as needed)
  const scoreboard = await prisma.player.findMany({
    // Example: include statistics or order as needed
    include: {
      statistics: true,
    },
    orderBy: [
      { statistics: { totalPoints: "desc" } },
      { statistics: { averageRank: "asc" } },
      { name: "asc" },
    ],
  });

  // Map to scoreboard data
  const scoreboardData = scoreboard.map((p, i) => ({
    id: p.id,
    rank: i + 1,
    name: p.name,
    totalPoints: p.statistics?.totalPoints || 0,
    tournaments: p.statistics?.totalTournaments || 0,
    averageRank: p.statistics?.averageRank || 0,
  }));

  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Club Scoreboard</h1>
      <ScoreboardTable players={scoreboardData} loading={false} />
    </div>
  );
}
