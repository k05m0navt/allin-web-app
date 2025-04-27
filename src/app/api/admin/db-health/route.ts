import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Try a very lightweight query
    await prisma.player.count();
    return NextResponse.json({ healthy: true });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
