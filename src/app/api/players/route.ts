import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all players (for admin use, e.g. to add to tournaments)
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      select: { id: true, name: true, telegram: true, phone: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ players });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch players." },
      { status: 500 }
    );
  }
}
