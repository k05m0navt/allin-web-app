"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/Skeleton";
import { useState, useEffect, use } from "react";

interface PlayerStatistics {
  totalTournaments: number;
  totalPoints: number;
  averageRank: number;
  bestRank: number | null;
  worstRank: number | null;
}
interface TournamentHistoryItem {
  id: string;
  name: string;
  date: string;
  points: number;
  rank: number | null;
}
interface PlayerProfile {
  id: string;
  name: string;
  statistics: PlayerStatistics;
  tournamentHistory: TournamentHistoryItem[];
}

export default function PlayerProfilePageWrapper({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/players/${playerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Player not found");
        return res.json();
      })
      .then((data: PlayerProfile) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [playerId]);

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-8 flex flex-col items-center">
        <div className="w-full max-w-xl space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-destructive">
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <p>This player does not exist or has been deleted.</p>
      </div>
    );
  }
  // Render the actual profile page
  return player ? <PlayerProfilePage player={player} /> : null;
}

function PlayerProfilePage({ player }: { player: PlayerProfile }) {
  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center animate-fade-in">{player.name}&apos;s Profile</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="transition-shadow duration-300 hover:shadow-lg focus-within:shadow-lg">
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Total Tournaments:</span> {player.statistics.totalTournaments}</p>
              <p><span className="font-medium">Total Points:</span> {player.statistics.totalPoints}</p>
              <p><span className="font-medium">Average Rank:</span> {player.statistics.averageRank.toFixed(2)}</p>
              {player.statistics.bestRank !== null && (
                <p><span className="font-medium">Best Rank:</span> {player.statistics.bestRank}</p>
              )}
              {typeof player.statistics.worstRank === "number" && player.statistics.worstRank !== null ? (
                <p><span className="font-medium">Worst Rank:</span> {player.statistics.worstRank}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow duration-300 hover:shadow-lg focus-within:shadow-lg">
          <CardHeader>
            <CardTitle>Tournament History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm animate-fade-in">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {player.tournamentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No tournaments played yet.</TableCell>
                    </TableRow>
                  ) : (
                    player.tournamentHistory.map((tournament) => (
                      <TableRow key={tournament.id} tabIndex={0} className="focus:bg-accent/40">
                        <TableCell>{tournament.name}</TableCell>
                        <TableCell>{tournament.date}</TableCell>
                        <TableCell>{tournament.points}</TableCell>
                        <TableCell>{tournament.rank ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// TODO: Add dark mode toggle and .animate-fade-in to globals.css
