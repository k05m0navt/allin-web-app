import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserFromRequest } from "@/lib/getUserFromRequest";
import { z } from "zod";

// Explicit zod schema for player update
const PlayerUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  telegram: z.string().optional(),
  phone: z.string().optional(),
});
type PlayerUpdateData = z.infer<typeof PlayerUpdateSchema>;


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        statistics: true,
        tournaments: {
          include: { tournament: true },
          orderBy: [{ tournament: { date: "desc" } }],
        },
      },
    });
    if (!player) {
      return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        id: player.id,
        name: player.name,
        telegram: player.telegram,
        phone: player.phone,
        statistics: player.statistics
          ? {
              totalTournaments: player.statistics.totalTournaments,
              totalPoints: player.statistics.totalPoints,
              averageRank: player.statistics.averageRank,
              bestRank: player.statistics.bestRank,
              // worstRank is not present in the model, so we omit it from the response
            }
          : null,
        tournamentHistory: player.tournaments
          .filter((pt) => pt.tournament)
          .map((pt) => ({
            id: pt.tournament.id,
            name: pt.tournament.name,
            date: pt.tournament.date instanceof Date ? pt.tournament.date.toISOString().slice(0, 10) : pt.tournament.date,
            points: pt.points,
            rank: pt.rank,
            reentries: pt.reentries ?? 0,
          })), 
      }
    });
  } catch (error) {
    console.error("GET /api/players/[playerId] error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  try {
    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parseResult = PlayerUpdateSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const data: PlayerUpdateData = parseResult.data;
    const oldPlayer = await prisma.player.findUnique({ where: { id: playerId } });
    const updated = await prisma.player.update({
      where: { id: playerId },
      data,
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entityType: "Player",
        entityId: playerId,
        details: { old: oldPlayer, new: updated },
      },
    });
    return NextResponse.json({ success: true, data: { player: updated } });
  } catch (error) {
    console.error("PUT /api/players/[playerId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  try {
    const oldPlayer = await prisma.player.findUnique({ where: { id: playerId } });
    await prisma.playerStatistics.deleteMany({ where: { playerId } });
    await prisma.playerTournament.deleteMany({ where: { playerId } });
    await prisma.player.delete({ where: { id: playerId } });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entityType: "Player",
        entityId: playerId,
        details: { deleted: oldPlayer },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/players/[playerId] error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to delete player" }, { status: 500 });
  }
}
