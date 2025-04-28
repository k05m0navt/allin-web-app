import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { playerId: string } }) {
  const { playerId } = await params;
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
        worstRank: player.statistics && "worstRank" in player.statistics ? player.statistics.worstRank : null,
      },
      tournamentHistory: player.tournaments.map((pt) => ({
        id: pt.tournament.id,
        name: pt.tournament.name,
        date: pt.tournament.date.toISOString().slice(0, 10),
        points: pt.points,
        rank: pt.rank,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { playerId: string } }) {
  const { playerId } = await params;
  try {
    const body = await req.json();
    const { name, telegram, phone } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const data: any = { name };
    if (telegram !== undefined) data.telegram = telegram;
    if (phone !== undefined) data.phone = phone;
    const updated = await prisma.player.update({
      where: { id: playerId },
      data,
    });
    return NextResponse.json({ player: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { playerId: string } }) {
  const { playerId } = await params;
  try {
    // Defensive: delete statistics first (1:1), then participations (1:N), then player
    await prisma.playerStatistics.deleteMany({ where: { playerId } });
    await prisma.playerTournament.deleteMany({ where: { playerId } });
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    // Log error for debugging
    console.error("Failed to delete player:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to delete player" }, { status: 500 });
  }
}
