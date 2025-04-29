import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalPlayers, totalTournaments, totalReentries, totalPoints] =
      await Promise.all([
        prisma.player.count(),
        prisma.tournament.count(),
        prisma.playerTournament
          .aggregate({ _sum: { reentries: true } })
          .then((r) => r._sum.reentries ?? 0),
        prisma.playerTournament
          .aggregate({ _sum: { points: true } })
          .then((r) => r._sum.points ?? 0),
      ]);
    return NextResponse.json({
      totalPlayers,
      totalTournaments,
      totalReentries,
      totalPoints,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch statistics." },
      { status: 500 }
    );
  }
}
