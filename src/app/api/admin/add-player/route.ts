import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/getUserFromRequest";
import { z } from "zod";

async function isDbHealthy() {
  try {
    await prisma.player.count();
    return true;
  } catch {
    return false;
  }
}

// Explicit zod schema for player creation
const PlayerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  telegram: z.string().optional(),
  phone: z.string().optional(),
});
type PlayerCreateData = z.infer<typeof PlayerCreateSchema>;

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  try {
    // Check DB health before proceeding
    const healthy = await isDbHealthy();
    if (!healthy) {
      return NextResponse.json({ success: false, error: "Database is currently unavailable. Please try again later." }, { status: 503 });
    }
    let json;
    try {
      json = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parseResult = PlayerCreateSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const data: PlayerCreateData = parseResult.data;
    const player = await prisma.player.create({
      data,
    });
    // Audit log can be awaited, but for performance, could be fire-and-forget in the future
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "Player",
        entityId: player.id,
        details: { created: player },
      },
    });
    return NextResponse.json({ success: true, data: { player } });
  } catch (error) {
    console.error("POST /api/admin/add-player error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
