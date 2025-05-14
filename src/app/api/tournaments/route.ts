import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getOrCreateUserFromRequest } from "@/lib/getUserFromRequest";

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
    return NextResponse.json({
      tournaments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error("GET /api/tournaments error:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUserFromRequest();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
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
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "Tournament",
        entityId: tournament.id,
        details: { created: tournament },
      },
    });
    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("POST /api/tournaments error:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
