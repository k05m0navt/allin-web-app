import { ScoreboardTable } from "@/components/Scoreboard/ScoreboardTable";
import { prisma } from "@/lib/prisma";

export default async function ScoreboardPage() {
  // Fetch all players with their statistics (adjust as needed)
  const scoreboard = await prisma.player.findMany({
    // Example: include statistics or order as needed
    include: {
      statistics: true,
    },
  });

  // Map to scoreboard data
  const scoreboardData = scoreboard.map((p) => ({
    id: p.id,
    name: p.name,
    totalPoints: p.statistics?.totalPoints || 0,
    tournaments: p.statistics?.totalTournaments || 0,
    bounty: p.statistics?.bounty || 0, // fallback if not present
    averageRank: p.statistics?.averageRank || 0,
    rank: 0, // will be set after sorting
  }));

  // Sort using the rules: totalPoints desc, tournaments desc, bounty desc, averageRank asc, name asc
  scoreboardData.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.tournaments !== a.tournaments) return b.tournaments - a.tournaments;
    if ((b.bounty ?? 0) !== (a.bounty ?? 0)) return (b.bounty ?? 0) - (a.bounty ?? 0);
    if (a.averageRank !== b.averageRank) return a.averageRank - b.averageRank;
    return a.name.localeCompare(b.name);
  });

  // Assign rank based on sorted position
  scoreboardData.forEach((p, i) => (p.rank = i + 1));

  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Club Scoreboard</h1>
      <ScoreboardTable players={scoreboardData} loading={false} />
    </div>
  );
}
