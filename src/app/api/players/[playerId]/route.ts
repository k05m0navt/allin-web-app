import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Explicit type for player update
interface PlayerUpdateData {
  name: string;
  telegram?: string;
  phone?: string;
}

export async function GET(
  req: NextRequest,
  context: { params: { playerId: string } }
) {
  const { playerId } = context.params;
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
        date: pt.tournament.date.toISOString().slice(0, 10),
        points: pt.points,
        rank: pt.rank,
        reentries: pt.reentries ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const { playerId } = params;
  try {
    const body = await req.json();
    const { name, telegram, phone } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const data: PlayerUpdateData = { name };
    if (telegram !== undefined) data.telegram = telegram;
    if (phone !== undefined) data.phone = phone;
    const updated = await prisma.player.update({
      where: { id: playerId },
      data,
    });
    return NextResponse.json({ player: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const { playerId } = params;
  try {
    // Defensive: delete statistics first (1:1), then participations (1:N), then player
    await prisma.playerStatistics.deleteMany({ where: { playerId } });
    await prisma.playerTournament.deleteMany({ where: { playerId } });
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error for debugging
    console.error("Failed to delete player:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete player",
      },
      { status: 500 }
    );
  }
}
