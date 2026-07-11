import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roomUpdateSchema } from "@/lib/validation";
import { slugify } from "@/lib/upload";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = roomUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid room update" }, { status: 400 });
    }

    const data = { ...parsed.data };

    if (
      parsed.data.capacityMin !== undefined &&
      parsed.data.capacityMax !== undefined &&
      parsed.data.capacityMax < parsed.data.capacityMin
    ) {
      return NextResponse.json(
        { error: "Maximum capacity must be at least the minimum." },
        { status: 400 },
      );
    }

    if (parsed.data.name) {
      const baseSlug = slugify(parsed.data.name);
      let slug = baseSlug;
      let suffix = 1;

      while (
        await prisma.roomType.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      Object.assign(data, { slug });
    }

    const room = await prisma.roomType.update({
      where: { id },
      data,
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

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;

    const bookings = await prisma.booking.count({
      where: { roomTypeId: id },
    });

    if (bookings > 0) {
      return NextResponse.json(
        { error: "Cannot remove a room that has bookings. Hide it instead." },
        { status: 400 },
      );
    }

    await prisma.roomType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
