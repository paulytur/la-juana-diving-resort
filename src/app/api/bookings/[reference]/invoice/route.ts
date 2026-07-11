import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureBookingInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

const INVOICE_STATUSES = new Set(["CONFIRMED", "COMPLETED"]);

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { reference } = await context.params;
    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: { roomType: true },
    });

    if (!booking || !INVOICE_STATUSES.has(booking.status)) {
      return NextResponse.json({ error: "Invoice not available" }, { status: 404 });
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
    console.error(error);
    return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
  }
}
