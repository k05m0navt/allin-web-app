import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function isDbHealthy() {
  try {
    await prisma.player.count();
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check DB health before proceeding
    const healthy = await isDbHealthy();
    if (!healthy) {
      return NextResponse.json({ error: "Database is currently unavailable. Please try again later." }, { status: 503 });
    }
    const { name, telegram, phone } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    // Create player only (no user)
    const data: any = { name };
    if (telegram !== undefined) data.telegram = telegram;
    if (phone !== undefined) data.phone = phone;
    const player = await prisma.player.create({
      data,
    });
    return NextResponse.json({ player });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
