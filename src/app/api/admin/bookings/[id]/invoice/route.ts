import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureBookingInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { roomType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Invoice is only available for confirmed bookings" },
        { status: 400 },
      );
    }

    const invoiceUrl = await ensureBookingInvoice(booking);

    if (invoiceUrl !== booking.invoiceUrl) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { invoiceUrl },
      });
    }

    return NextResponse.redirect(invoiceUrl);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
  }
}
