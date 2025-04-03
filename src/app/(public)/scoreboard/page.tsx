import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getScoreboard() {
  // TODO: Replace with actual Prisma query
  return [
    {
      rank: 1,
      name: "John Doe",
      totalPoints: 150,
      tournaments: 10,
      averageRank: 2.5,
    },
    {
      rank: 2,
      name: "Jane Smith",
      totalPoints: 120,
      tournaments: 8,
      averageRank: 3.0,
    },
  ];
}

export default async function ScoreboardPage() {
  const scoreboard = await getScoreboard();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Club Scoreboard</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Total Points</TableHead>
            <TableHead>Tournaments</TableHead>
            <TableHead>Average Rank</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scoreboard.map((player) => (
            <TableRow key={player.name}>
              <TableCell>{player.rank}</TableCell>
              <TableCell>{player.name}</TableCell>
              <TableCell>{player.totalPoints}</TableCell>
              <TableCell>{player.tournaments}</TableCell>
              <TableCell>{player.averageRank.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
