import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";
import { z } from "zod";

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
    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const PlayerAddSchema = z.object({ playerId: z.string().min(1, "Player ID is required.") });
    const parseResult = PlayerAddSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const { playerId } = parseResult.data;
    // Prevent duplicates
    const exists = await prisma.playerTournament.findUnique({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "Player already in tournament." }, { status: 400 });
    }
    await prisma.playerTournament.create({
      data: { playerId, tournamentId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/tournaments/[tournamentId]/players error:", error);
    return NextResponse.json({ success: false, error: "Failed to add player." }, { status: 500 });
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
    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const PlayerRemoveSchema = z.object({ playerId: z.string().min(1, "Player ID is required.") });
    const parseResult = PlayerRemoveSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const { playerId } = parseResult.data;
    await prisma.playerTournament.delete({
      where: { playerId_tournamentId: { playerId, tournamentId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tournaments/[tournamentId]/players error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove player." }, { status: 500 });
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
    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const PlayerUpdateSchema = z.object({
      playerId: z.string().min(1, "Player ID is required."),
      rank: z.number().int().min(1).optional(),
      points: z.number().int().optional(),
      bounty: z.number().optional(),
      reentries: z.number().int().optional(),
    });
    const parseResult = PlayerUpdateSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const { playerId, rank, points, bounty, reentries } = parseResult.data;
    const update: any = {};
    if (rank !== undefined) update.rank = rank;
    if (points !== undefined) update.points = points;
    if (bounty !== undefined) update.bounty = bounty;
    if (reentries !== undefined) update.reentries = reentries;
    const updated = await prisma.playerTournament.update({
      where: { playerId_tournamentId: { playerId, tournamentId } },
      data: update,
    });
    return NextResponse.json({ success: true, data: { playerTournament: updated } });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("PATCH /api/tournaments/[tournamentId]/players error:", e);
    return NextResponse.json({ success: false, error: "Failed to update player." }, { status: 500 });
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
    return NextResponse.json({ success: true, data: { players } }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error("GET /api/tournaments/[tournamentId]/players error:", error);
    return NextResponse.json({ success: false, error: "Failed to get players." }, { status: 500 });
  }
}
