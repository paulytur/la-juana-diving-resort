import { NextResponse } from "next/server";
import { BookingError, createBooking } from "@/lib/create-booking";
import { prisma } from "@/lib/db";
import { formatPartnerBooking } from "@/lib/partner-booking";
import {
  buildPartnerCheckoutUrl,
  getPartnerFromRequest,
  partnerCorsHeaders,
  partnerUnauthorizedMessage,
} from "@/lib/partner";
import { partnerBookingSchema } from "@/lib/validation";

function corsJson(request: Request, body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: partnerCorsHeaders(request),
  });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: partnerCorsHeaders(request),
  });
}

export async function POST(request: Request) {
  const partnerAccount = await getPartnerFromRequest(request);
  if (!partnerAccount) {
    return corsJson(request, { error: partnerUnauthorizedMessage() }, 401);
  }

  try {
    const body = await request.json();
    const parsed = partnerBookingSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson(
        request,
        { error: parsed.error.issues[0]?.message ?? "Invalid booking data" },
        400,
      );
    }

    const data = parsed.data;
    let roomTypeId = data.roomTypeId;
    let roomSlug = data.roomSlug;

    if (!roomTypeId && data.roomSlug) {
      const room = await prisma.roomType.findUnique({
        where: { slug: data.roomSlug, isActive: true },
      });
      if (!room) {
        return corsJson(request, { error: "Room not found" }, 404);
      }
      roomTypeId = room.id;
      roomSlug = room.slug;
    } else if (roomTypeId && !roomSlug) {
      const room = await prisma.roomType.findUnique({
        where: { id: roomTypeId, isActive: true },
      });
      if (!room) {
        return corsJson(request, { error: "Room not found" }, 404);
      }
      roomSlug = room.slug;
    }

    const hasPayment = Boolean(data.paymentProofUrl);
    const hasGuest = Boolean(data.guestName && data.guestEmail && data.guestPhone);

    if (!hasPayment) {
      if (hasGuest) {
        const booking = await createBooking({
          roomTypeId: roomTypeId!,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guests: data.guests,
          guestName: data.guestName!,
          guestEmail: data.guestEmail!,
          guestPhone: data.guestPhone!,
          specialRequests: data.specialRequests,
          pets: data.pets,
          dayTourGuests: data.dayTourGuests,
          partnerSource: partnerAccount.slug,
        });

        const formatted = formatPartnerBooking(booking);
        return corsJson(
          request,
          {
            ...formatted,
            message:
              "Booking created. Redirect the guest to paymentUrl to scan the QR and upload their receipt on La Juana.",
          },
          201,
        );
      }

      return corsJson(request, {
        checkoutUrl: buildPartnerCheckoutUrl({
          partner: partnerAccount.slug,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guests: data.guests,
          room: roomSlug,
        }),
        message:
          "Guest contact is required to create a booking. Either include guestName, guestEmail, and guestPhone, or send the guest to checkoutUrl to enter details and pay on La Juana.",
      });
    }

    const booking = await createBooking({
      roomTypeId: roomTypeId!,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      guestName: data.guestName!,
      guestEmail: data.guestEmail!,
      guestPhone: data.guestPhone!,
      specialRequests: data.specialRequests,
      pets: data.pets,
      dayTourGuests: data.dayTourGuests,
      paymentReference: data.paymentReference,
      paymentProofUrl: data.paymentProofUrl,
      partnerSource: partnerAccount.slug,
    });

    return corsJson(request, formatPartnerBooking(booking), 201);
  } catch (error) {
    if (error instanceof BookingError) {
      return corsJson(request, { error: error.message }, error.status);
    }
    console.error(error);
    return corsJson(request, { error: "Unable to create booking" }, 500);
  }
}

export async function GET(request: Request) {
  const partnerAccount = await getPartnerFromRequest(request);
  if (!partnerAccount) {
    return corsJson(request, { error: partnerUnauthorizedMessage() }, 401);
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return corsJson(request, { error: "reference query parameter is required" }, 400);
  }

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { roomType: true },
  });

  if (!booking || booking.partnerSource !== partnerAccount.slug) {
    return corsJson(request, { error: "Booking not found" }, 404);
  }

  return corsJson(request, formatPartnerBooking(booking));
}
