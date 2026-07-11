import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { facilityUpdateSchema } from "@/lib/validation";
import { slugify } from "@/lib/upload";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = facilityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid facility update" }, { status: 400 });
    }

    const data = { ...parsed.data };

    if (parsed.data.name) {
      const baseSlug = slugify(parsed.data.name);
      let slug = baseSlug;
      let suffix = 1;

      while (
        await prisma.facility.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      Object.assign(data, { slug });
    }

    const facility = await prisma.facility.update({
      where: { id },
      data,
    });

    return NextResponse.json(facility);
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

    await prisma.facility.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
