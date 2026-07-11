import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePartnerApiKey } from "@/lib/partner";
import { slugify } from "@/lib/upload";
import { partnerCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdminSession();
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(partners);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load partners" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const parsed = partnerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid partner data" }, { status: 400 });
    }

    const baseSlug = slugify(parsed.data.name);
    if (!baseSlug) {
      return NextResponse.json({ error: "Invalid partner name" }, { status: 400 });
    }

    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.partner.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const partner = await prisma.partner.create({
      data: {
        slug,
        name: parsed.data.name,
        apiKey: generatePartnerApiKey(),
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
