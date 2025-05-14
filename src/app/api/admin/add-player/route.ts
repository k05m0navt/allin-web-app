import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

async function isDbHealthy() {
  try {
    await prisma.player.count();
    return true;
  } catch {
    return false;
  }
}

// Explicit type for player creation
interface PlayerCreateData {
  name: string;
  telegram?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
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
    if (telegram && typeof telegram !== "string") {
      return NextResponse.json({ error: "Invalid telegram username" }, { status: 400 });
    }
    if (phone && typeof phone !== "string") {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }
    // Create player only (no user)
    const data: PlayerCreateData = { name };
    if (telegram !== undefined) data.telegram = telegram;
    if (phone !== undefined) data.phone = phone;
    const player = await prisma.player.create({
      data,
    });
    return NextResponse.json({ player });
  } catch (error) {
    console.error("POST /api/admin/add-player error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
