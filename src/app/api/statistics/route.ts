import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    const statistics = {
      totalPlayers,
      totalTournaments,
      totalReentries,
      totalPoints,
    };
    return NextResponse.json({ success: true, data: statistics }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error("GET /api/statistics error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch statistics." }, { status: 500 });
  }
}
