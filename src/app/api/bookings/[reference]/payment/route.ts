import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingPaymentSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { reference } = await context.params;
    const body = await request.json();
    const parsed = bookingPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payment data" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { reference },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking was cancelled" }, { status: 400 });
    }

    if (
      booking.paymentReference &&
      booking.paymentProofUrl &&
      booking.guestEmail.toLowerCase() !== parsed.data.guestEmail.toLowerCase()
    ) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      booking.guestEmail.toLowerCase() !== parsed.data.guestEmail.toLowerCase()
    ) {
      return NextResponse.json({ error: "Email does not match this booking" }, { status: 403 });
    }

    if (booking.paymentReference && booking.paymentProofUrl) {
      return NextResponse.json(
        { error: "Payment already submitted for this booking" },
        { status: 409 },
      );
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentReference: parsed.data.paymentReference,
        paymentProofUrl: parsed.data.paymentProofUrl,
      },
      include: { roomType: true },
    });

    return NextResponse.json({
      reference: updated.reference,
      status: updated.status,
      paymentReference: updated.paymentReference,
      paymentProofUrl: updated.paymentProofUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update payment" }, { status: 500 });
  }
}
