import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string | null;
}

export default async function TournamentsPage() {
  const tournamentsRaw = await prisma.tournament.findMany({
    orderBy: { date: "desc" }
  });
  const tournaments: Tournament[] = tournamentsRaw.map((t) => ({
    id: t.id,
    name: t.name,
    date: t.date instanceof Date ? t.date.toISOString() : t.date,
    location: t.location,
    description: t.description ?? null,
  }));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">All Tournaments</h1>
      <div className="space-y-4">
        {tournaments.length === 0 && (
          <div className="text-center text-muted-foreground">
            No tournaments found.
          </div>
        )}
        {tournaments.map((tournament) => (
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
