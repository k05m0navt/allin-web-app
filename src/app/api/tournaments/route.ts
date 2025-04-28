import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ tournaments });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, date, location, description } = await req.json();
    if (!name || !date || !location) {
      return NextResponse.json({ error: "Name, date, and location are required" }, { status: 400 });
    }
    const tournament = await prisma.tournament.create({
      data: {
        name,
        date: new Date(date),
        location,
        description: description || undefined,
      },
    });
    return NextResponse.json({ tournament });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
