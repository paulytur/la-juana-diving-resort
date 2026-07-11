import { NextResponse } from "next/server";
import { isRoomAvailable } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { resolvePartnerSlug } from "@/lib/partner";
import {
  calculateBookingTotal,
  calculateDeposit,
  generateBookingReference,
  parseDateInput,
} from "@/lib/pricing";
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
    const checkIn = parseDateInput(data.checkIn);
    const checkOut = parseDateInput(data.checkOut);

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId, isActive: true },
    });
    if (!roomType) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (data.guests < roomType.capacityMin || data.guests > roomType.capacityMax) {
      return NextResponse.json(
        {
          error: `${roomType.name} accommodates ${roomType.capacityMin}–${roomType.capacityMax} guests`,
        },
        { status: 400 },
      );
    }

    const available = await isRoomAvailable(
      data.roomTypeId,
      checkIn,
      checkOut,
      data.guests,
    );
    if (!available) {
      return NextResponse.json(
        { error: "Selected room is not available for those dates" },
        { status: 409 },
      );
    }

    const pricing = calculateBookingTotal({
      roomType,
      checkIn,
      checkOut,
      guests: data.guests,
      pets: data.pets,
      dayTourGuests: data.dayTourGuests,
    });

    const booking = await prisma.booking.create({
      data: {
        reference: generateBookingReference(),
        roomTypeId: data.roomTypeId,
        checkIn,
        checkOut,
        guests: data.guests,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        specialRequests: data.specialRequests,
        pets: data.pets,
        dayTourGuests: data.dayTourGuests,
        subtotal: pricing.subtotal,
        petFee: pricing.petFee,
        dayTourFee: pricing.dayTourFee,
        totalAmount: pricing.totalAmount,
        nights: pricing.nights,
        depositAmount: calculateDeposit(pricing.totalAmount),
        paymentReference: data.paymentReference,
        paymentProofUrl: data.paymentProofUrl,
        partnerSource: await resolvePartnerSlug(data.partnerSource),
      },
      include: { roomType: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
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
