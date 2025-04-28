import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: "desc" }
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">All Tournaments</h1>
      <div className="space-y-4">
        {tournaments.length === 0 && (
          <div className="text-center text-muted-foreground">
            No tournaments found.
          </div>
        )}
        {tournaments.map((tournament: any) => (
          <Card key={tournament.id} className="w-full">
            <CardHeader>
              <CardTitle>{tournament.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-1">
                {new Date(tournament.date).toLocaleDateString()} &bull; {tournament.location}
              </div>
              {tournament.description && (
                <div className="text-base">{tournament.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
