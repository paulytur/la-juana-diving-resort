import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/upload";
import { roomCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdminSession();
    const rooms = await prisma.roomType.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ["PENDING", "CONFIRMED"] } },
            },
          },
        },
      },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load rooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const parsed = roomCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid room data" }, { status: 400 });
    }

    if (parsed.data.capacityMax < parsed.data.capacityMin) {
      return NextResponse.json(
        { error: "Maximum capacity must be at least the minimum." },
        { status: 400 },
      );
    }

    const baseSlug = slugify(parsed.data.name);
    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.roomType.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const maxSort = await prisma.roomType.aggregate({
      _max: { sortOrder: true },
    });

    const room = await prisma.roomType.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        beds: parsed.data.beds,
        capacityMin: parsed.data.capacityMin,
        capacityMax: parsed.data.capacityMax,
        pricePerNight: parsed.data.pricePerNight,
        pricePerPerson: parsed.data.pricePerPerson ?? false,
        inventory: parsed.data.inventory ?? 1,
        imageUrl: parsed.data.imageUrl ?? null,
        sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        isActive: parsed.data.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ["PENDING", "CONFIRMED"] } },
            },
          },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
