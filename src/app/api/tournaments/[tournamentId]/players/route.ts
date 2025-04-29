import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// Add a player to a tournament
export async function POST(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { playerId } = await req.json();
    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }
    // Prevent duplicates
    const exists = await prisma.playerTournament.findUnique({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Player already in tournament." },
        { status: 400 }
      );
    }
    await prisma.playerTournament.create({
      data: { playerId, tournamentId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to add player." },
      { status: 500 }
    );
  }
}

// Remove a player from a tournament
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { playerId } = await req.json();
    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }
    await prisma.playerTournament.deleteMany({
      where: { playerId, tournamentId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove player." },
      { status: 500 }
    );
  }
}

// Update a player's place, bounty, and points in a tournament
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { playerId, points, rank, bounty, reentries } = await req.json();
    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }
    const updateData: Record<string, number | null> = {};
    if (typeof points === "number") updateData.points = points;
    if (typeof rank === "number") updateData.rank = rank;
    if (typeof bounty === "number" || bounty === null)
      updateData.bounty = bounty;
    if (typeof reentries === "number" || reentries === null)
      updateData.reentries = reentries;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }
    // Debug: check if playerTournament exists before update
    const exists = await prisma.playerTournament.findUnique({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "PlayerTournament not found (pre-check)." },
        { status: 404 }
      );
    }
    await prisma.playerTournament.update({
      where: { playerId_tournamentId: { playerId, tournamentId } },
      data: updateData,
    });

    // After any update, recalculate and persist points for all ranked players in the tournament
    const allPTs = await prisma.playerTournament.findMany({
      where: { tournamentId },
    });
    const ranked = allPTs
      .filter((pt) => pt.rank != null)
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    const n = ranked.length;
    for (let idx = 0; idx < n; idx++) {
      const pt = ranked[idx];
      const newPoints = n - idx;
      if (pt.points !== newPoints) {
        await prisma.playerTournament.update({
          where: {
            playerId_tournamentId: { playerId: pt.playerId, tournamentId },
          },
          data: { points: newPoints },
        });
      }
    }

    // --- Update PlayerStatistics for all affected players ---
    // Get all unique playerIds in this tournament
    const playerIds = Array.from(new Set(allPTs.map((pt) => pt.playerId)));
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
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to update player.", detail },
      { status: 500 }
    );
  }
}

// Get all players in a tournament
export async function GET(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  const { tournamentId } = await params;
  try {
    const players = await prisma.playerTournament.findMany({
      where: { tournamentId },
      include: { player: true },
    });
    return NextResponse.json({ players }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60'
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get players." },
      { status: 500 }
    );
  }
}
