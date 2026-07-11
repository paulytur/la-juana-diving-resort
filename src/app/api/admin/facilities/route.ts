import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { facilityCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/upload";

export async function GET() {
  try {
    await requireAdminSession();
    const facilities = await prisma.facility.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(facilities);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load facilities" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const parsed = facilityCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid facility data" }, { status: 400 });
    }

    const baseSlug = slugify(parsed.data.name);
    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.facility.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const maxSort = await prisma.facility.aggregate({
      _max: { sortOrder: true },
    });

    const facility = await prisma.facility.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
