import { NextResponse } from "next/server";
import { BookingError, createBooking } from "@/lib/create-booking";
import { prisma } from "@/lib/db";
import { resolvePartnerSlug } from "@/lib/partner";
import { bookingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid booking data" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const result = await createBooking({
      roomTypeId: data.roomTypeId,
      rooms: data.rooms,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      specialRequests: data.specialRequests,
      pets: data.pets,
      dayTourGuests: data.dayTourGuests,
      paymentReference: data.paymentReference,
      paymentProofUrl: data.paymentProofUrl,
      partnerSource: await resolvePartnerSlug(data.partnerSource),
    });

    return NextResponse.json(
      {
        ...result.bookings[0],
        reference: result.reference,
        groupReference: result.groupReference,
        groupTotalAmount: result.totalAmount,
        groupDepositAmount: result.depositAmount,
        groupBookings: result.bookings,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create booking" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { roomType: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}
