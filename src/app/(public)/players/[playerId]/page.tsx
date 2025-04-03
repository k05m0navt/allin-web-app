import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Mock data - will be replaced with actual Prisma query
async function getPlayerProfile(playerId: string) {
  return {
    id: playerId,
    name: "John Doe",
    email: "john@example.com",
    statistics: {
      totalTournaments: 15,
      totalPoints: 250,
      averageRank: 2.7,
      bestRank: 1
    },
    tournamentHistory: [
      { 
        id: "1", 
        name: "Summer Tournament", 
        date: "2023-07-15", 
        points: 30, 
        rank: 2 
      },
      { 
        id: "2", 
        name: "Winter Championship", 
        date: "2023-12-20", 
        points: 45, 
        rank: 1 
      }
    ]
  };
}

export default async function PlayerProfilePage({ 
  params 
}: { 
  params: { playerId: string } 
}) {
  const player = await getPlayerProfile(params.playerId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{player.name}'s Profile</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Total Tournaments: {player.statistics.totalTournaments}</p>
              <p>Total Points: {player.statistics.totalPoints}</p>
              <p>Average Rank: {player.statistics.averageRank.toFixed(1)}</p>
              <p>Best Rank: {player.statistics.bestRank}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tournament History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.tournamentHistory.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell>{tournament.name}</TableCell>
                    <TableCell>{tournament.date}</TableCell>
                    <TableCell>{tournament.points}</TableCell>
                    <TableCell>{tournament.rank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}