import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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
          <Link key={tournament.id} href={`/tournaments/${tournament.id}`} passHref legacyBehavior>
            <a tabIndex={0} className="block w-full focus:outline-none focus:ring-2 focus:ring-primary">
              <Card className="w-full cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary/60 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:via-zinc-950 group">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                      {tournament.name}
                    </CardTitle>
                  </div>
                  <span className="w-5 h-5 text-muted-foreground mr-1" role="img" aria-label="date">📅</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(tournament.date).toLocaleDateString()}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4" role="img" aria-label="location">📍</span>
                    <span className="truncate">{tournament.location}</span>
                  </div>
                  {tournament.description && (
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-sm mt-1">
                      <span className="w-4 h-4 flex-shrink-0" role="img" aria-label="description">📝</span>
                      <span className="truncate">{tournament.description}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
