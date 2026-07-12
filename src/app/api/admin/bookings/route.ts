import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { BookingError, createBooking } from "@/lib/create-booking";
import { prisma } from "@/lib/db";
import { createBookingInvoice } from "@/lib/invoice";
import { adminBookingCreateSchema } from "@/lib/validation";

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

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const parsed = adminBookingCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { confirmImmediately, adminNotes, guestEmail, ...bookingInput } =
      parsed.data;
    const status = confirmImmediately ? "CONFIRMED" : "PENDING";

    const result = await createBooking({
      ...bookingInput,
      guestEmail: guestEmail ?? `walkin-${Date.now()}@lajuana.local`,
      status,
      adminNotes,
    });

    const bookings = [];
    for (const booking of result.bookings) {
      let invoiceUrl = booking.invoiceUrl;

      if (status === "CONFIRMED" && !invoiceUrl) {
        try {
          invoiceUrl = await createBookingInvoice(booking);
        } catch (error) {
          console.error("Invoice generation failed:", error);
        }
      }

      if (invoiceUrl && invoiceUrl !== booking.invoiceUrl) {
        const updated = await prisma.booking.update({
          where: { id: booking.id },
          data: { invoiceUrl },
          include: { roomType: true },
        });
        bookings.push(updated);
      } else {
        bookings.push(booking);
      }
    }

    return NextResponse.json(
      {
        reference: result.reference,
        groupReference: result.groupReference,
        status,
        totalAmount: result.totalAmount,
        depositAmount: result.depositAmount,
        bookings,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
