import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all players (for admin use, e.g. to add to tournaments)
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
            { telegram: { contains: search, mode: 'insensitive' as any } },
            { phone: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : undefined;
    const [players, total] = await Promise.all([
      prisma.player.findMany({
        select: { id: true, name: true, telegram: true, phone: true, createdAt: true },
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);
    return NextResponse.json({
      players,
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
    console.error("GET /api/players error:", error);
    return NextResponse.json(
      { error: "Failed to fetch players." },
      { status: 500 }
    );
  }
}
