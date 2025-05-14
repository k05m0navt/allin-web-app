import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

// Explicit type for player update
interface PlayerUpdateData {
  name: string;
  telegram?: string;
  phone?: string;
}

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
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: player.id,
      name: player.name,
      statistics: {
        totalTournaments: player.statistics?.totalTournaments ?? 0,
        totalPoints: player.statistics?.totalPoints ?? 0,
        averageRank: player.statistics?.averageRank ?? 0,
        bestRank: player.statistics?.bestRank ?? null,
        worstRank:
          player.statistics && "worstRank" in player.statistics
            ? player.statistics.worstRank
            : null,
      },
      tournamentHistory: player.tournaments.map((pt) => ({
        id: pt.tournament.id,
        name: pt.tournament.name,
        date: pt.tournament.date instanceof Date ? pt.tournament.date.toISOString().slice(0, 10) : pt.tournament.date,
        points: pt.points,
        rank: pt.rank,
        reentries: pt.reentries ?? 0,
      })),
    });
  } catch (error) {
    console.error("GET /api/players/[playerId] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { name, telegram, phone } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    // Basic validation for phone/telegram
    if (telegram && typeof telegram !== "string") {
      return NextResponse.json({ error: "Invalid telegram username" }, { status: 400 });
    }
    if (phone && typeof phone !== "string") {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }
    const data: PlayerUpdateData = { name };
    if (telegram !== undefined) data.telegram = telegram;
    if (phone !== undefined) data.phone = phone;
    const updated = await prisma.player.update({
      where: { id: playerId },
      data,
    });
    return NextResponse.json({ player: updated });
  } catch (error) {
    console.error("PUT /api/players/[playerId] error:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await context.params;
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    await prisma.playerStatistics.deleteMany({ where: { playerId } });
    await prisma.playerTournament.deleteMany({ where: { playerId } });
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/players/[playerId] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete player",
      },
      { status: 500 }
    );
  }
}
