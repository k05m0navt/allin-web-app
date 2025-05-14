import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getOrCreateUserFromRequest } from "@/lib/getUserFromRequest";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as any } },
            { location: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : undefined;
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        orderBy: { date: "desc" },
        where,
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);
    console.log("[Tournaments List API] Tournament IDs:", tournaments.map(t => t.id));
    return NextResponse.json({
      success: true,
      data: {
        tournaments,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error("GET /api/tournaments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

const TournamentCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  buyin: z.number().min(0).default(0),
  rebuy: z.number().min(0).default(0),
});
type TournamentCreateData = z.infer<typeof TournamentCreateSchema>;

export async function POST(req: NextRequest) {
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  try {
    let json;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parseResult = TournamentCreateSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const { name, date, location, description, buyin, rebuy } = parseResult.data;
    const tournament = await prisma.tournament.create({
      data: {
        name,
        date: new Date(date),
        location,
        description: description || undefined,
        buyin: typeof buyin === 'number' ? buyin : 0,
        rebuy: typeof rebuy === 'number' ? rebuy : 0,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "Tournament",
        entityId: tournament.id,
        details: { created: tournament },
      },
    });
    return NextResponse.json({ success: true, data: { tournament } });
  } catch (error) {
    console.error("POST /api/tournaments error:", error);
    return NextResponse.json({ success: false, error: "Failed to create tournament" }, { status: 500 });
  }
}
