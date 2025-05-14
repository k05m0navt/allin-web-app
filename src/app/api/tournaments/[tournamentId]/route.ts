import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserFromRequest } from "@/lib/getUserFromRequest";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  try {
    console.log("[Tournament Detail API] Requested tournamentId:", tournamentId);
    // DEBUG: Directly check with findMany
    const tournaments = await prisma.tournament.findMany({ where: { id: tournamentId } });
    console.log("[Tournament Detail API] findMany result:", tournaments);
    // Use PlayerTournament join table to fetch players for this tournament
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId },
    });
    if (!tournament) {
      console.log(`[Tournament Detail API] Tournament not found for id: ${tournamentId}`);
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
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
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error("GET /api/tournaments/[tournamentId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tournament." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  let json;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
  // Validate input with zod
  const TournamentUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    date: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
  });
  const parseResult = TournamentUpdateSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }
  const data = parseResult.data;

  try {
    const oldTournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data,
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entityType: "Tournament",
        entityId: tournamentId,
        details: { old: oldTournament, new: updated },
      },
    });
    return NextResponse.json({ success: true, data: { tournament: updated } });
  } catch (error) {
    console.error("PUT /api/tournaments/[tournamentId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update tournament" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    // Find all playerIds who participated in this tournament
    const playerTournaments = await prisma.playerTournament.findMany({
      where: { tournamentId },
    });
    const playerIds = Array.from(
      new Set(playerTournaments.map((pt) => pt.playerId))
    );
    const oldTournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    // Delete all PlayerTournament records for this tournament
    await prisma.playerTournament.deleteMany({ where: { tournamentId } });
    // Delete the tournament itself
    await prisma.tournament.delete({ where: { id: tournamentId } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entityType: "Tournament",
        entityId: tournamentId,
        details: { deleted: oldTournament },
      },
    });
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
  } catch (error) {
    console.error("DELETE /api/tournaments/[tournamentId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete tournament." }, { status: 500 });
  }
}
