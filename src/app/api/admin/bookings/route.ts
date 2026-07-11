import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdminSession();
    const bookings = await prisma.booking.findMany({
      include: { roomType: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
