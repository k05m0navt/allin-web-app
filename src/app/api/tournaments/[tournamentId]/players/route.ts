import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// Add a player to a tournament
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
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
  } catch (error) {
    console.error("POST /api/tournaments/[tournamentId]/players error:", error);
    return NextResponse.json(
      { error: "Failed to add player." },
      { status: 500 }
    );
  }
}

// Remove a player from a tournament
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { playerId } = await req.json();
    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required." }, { status: 400 });
    }
    await prisma.playerTournament.delete({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tournaments/[tournamentId]/players error:", error);
    return NextResponse.json(
      { error: "Failed to remove player." },
      { status: 500 }
    );
  }
}

// Update a player's place, bounty, and points in a tournament
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { playerId, rank, points, bounty, reentries } = await req.json();
    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required." }, { status: 400 });
    }
    const update: any = {};
    if (rank !== undefined) update.rank = rank;
    if (points !== undefined) update.points = points;
    if (bounty !== undefined) update.bounty = bounty;
    if (reentries !== undefined) update.reentries = reentries;
    const updated = await prisma.playerTournament.update({
      where: { playerId_tournamentId: { playerId, tournamentId } },
      data: update,
    });
    return NextResponse.json({ playerTournament: updated });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("PATCH /api/tournaments/[tournamentId]/players error:", e);
    return NextResponse.json(
      { error: "Failed to update player.", detail },
      { status: 500 }
    );
  }
}

// Get all players in a tournament
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
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
