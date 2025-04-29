import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { tournamentId: string } }) {
  const { tournamentId } = params;
  try {
    const { name, date, location, description } = await req.json();
    if (!name || !date || !location) {
      return NextResponse.json({ error: "Name, date, and location are required." }, { status: 400 });
    }
    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name,
        date: new Date(date),
        location,
        description: description || undefined,
      },
    });
    return NextResponse.json({ tournament: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update tournament." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { tournamentId: string } }) {
  const { tournamentId } = params;
  try {
    await prisma.tournament.delete({ where: { id: tournamentId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete tournament." }, { status: 500 });
  }
}
