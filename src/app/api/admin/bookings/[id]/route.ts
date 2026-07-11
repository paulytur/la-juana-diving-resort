import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBookingInvoice } from "@/lib/invoice";
import { bookingStatusSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = bookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { roomType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let invoiceUrl = existing.invoiceUrl;

    if (
      parsed.data.status === "CONFIRMED" &&
      existing.status !== "CONFIRMED" &&
      !invoiceUrl
    ) {
      try {
        invoiceUrl = await createBookingInvoice(existing);
      } catch (error) {
        console.error("Invoice generation failed:", error);
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes,
        ...(invoiceUrl ? { invoiceUrl } : {}),
      },
      include: { roomType: true },
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
