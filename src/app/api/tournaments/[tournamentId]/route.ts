import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  try {
    // Use PlayerTournament join table to fetch players for this tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }
    // Find all PlayerTournament records for this tournament, join Player
    const playerTournaments = await prisma.playerTournament.findMany({
      where: { tournamentId },
      include: { player: { select: { id: true, name: true } } },
    });
    // Merge player fields with tournament stats (rank, points, bounty, reentries)
    // Calculate points: nth place gets 1, (n-1)th gets 2, ..., 1st gets n
    // Only assign points for players with a rank (not null)
    const ranked = playerTournaments
      .filter((pt) => pt.rank != null)
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    const n = ranked.length;
    const pointsMap = new Map();
    ranked.forEach((pt, idx) => {
      // idx: 0 is 1st place, idx: n-1 is last place
      pointsMap.set(pt.playerId, n - idx);
    });
    const players = playerTournaments.map((pt) => ({
      id: pt.player.id,
      name: pt.player.name,
      rank: pt.rank,
      points: pointsMap.has(pt.playerId)
        ? pointsMap.get(pt.playerId)
        : pt.points,
      bounty: pt.bounty,
      reentries: pt.reentries ?? 0,
    }));
    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        date:
          tournament.date instanceof Date
            ? tournament.date.toISOString()
            : tournament.date,
        location: tournament.location,
        description: tournament.description,
        players,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tournament." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  // You may want to check admin auth here (if you have a getUserFromRequest helper)
  // Example:
  // const user = await getUserFromRequest(req);
  // if (!user || user.role !== "ADMIN") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // }
  try {
    // Find all playerIds who participated in this tournament
    const playerTournaments = await prisma.playerTournament.findMany({
      where: { tournamentId },
    });
    const playerIds = Array.from(
      new Set(playerTournaments.map((pt) => pt.playerId))
    );
    // Delete all PlayerTournament records for this tournament
    await prisma.playerTournament.deleteMany({ where: { tournamentId } });
    // Delete the tournament itself
    await prisma.tournament.delete({ where: { id: tournamentId } });
    // Recalculate statistics for affected players
    for (const pid of playerIds) {
      const participations = await prisma.playerTournament.findMany({
        where: { playerId: pid },
      });
      const totalTournaments = participations.length;
      const totalPoints = participations.reduce(
        (sum, pt) => sum + (pt.points ?? 0),
        0
      );
      const totalBounty = participations.reduce(
        (sum, pt) => sum + (pt.bounty ?? 0),
        0
      );
      const rankedEntries = participations.filter((pt) => pt.rank != null);
      const averageRank =
        rankedEntries.length > 0
          ? rankedEntries.reduce((sum, pt) => sum + (pt.rank ?? 0), 0) /
            rankedEntries.length
          : 0;
      const bestRank =
        rankedEntries.length > 0
          ? Math.min(...rankedEntries.map((pt) => pt.rank!))
          : null;
      await prisma.playerStatistics.upsert({
        where: { playerId: pid },
        update: {
          totalTournaments,
          totalPoints,
          averageRank,
          bestRank,
          bounty: totalBounty,
        },
        create: {
          playerId: pid,
          totalTournaments,
          totalPoints,
          averageRank,
          bestRank,
          bounty: totalBounty,
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete tournament." },
      { status: 500 }
    );
  }
}
