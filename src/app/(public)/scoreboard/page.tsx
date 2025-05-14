"use client";
import { useState, useEffect } from "react";
import { ScoreboardTable, ScoreboardPlayer } from "@/components/Scoreboard/ScoreboardTable";

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<ScoreboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/players?page=1&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        // Sort and rank on client
        const scoreboardData: ScoreboardPlayer[] = (data.players || []).map((p: any) => ({
          ...p,
          totalPoints: p.totalPoints || 0,
          tournaments: p.tournaments || 0,
          bounty: p.bounty || 0,
          averageRank: p.averageRank || 0,
          rank: 0,
        }));
        scoreboardData.sort((a: ScoreboardPlayer, b: ScoreboardPlayer) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.tournaments !== a.tournaments) return b.tournaments - a.tournaments;
    if ((b.bounty ?? 0) !== (a.bounty ?? 0)) return (b.bounty ?? 0) - (a.bounty ?? 0);
    if (a.averageRank !== b.averageRank) return a.averageRank - b.averageRank;
    return a.name.localeCompare(b.name);
  });
        scoreboardData.forEach((p: ScoreboardPlayer, i: number) => (p.rank = i + 1));
        setPlayers(scoreboardData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Club Scoreboard</h1>
      <ScoreboardTable players={players} loading={loading} />
    </div>
  );
}
