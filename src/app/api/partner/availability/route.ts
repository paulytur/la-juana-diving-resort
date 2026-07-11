import { NextResponse } from "next/server";
import { getAvailableRooms } from "@/lib/availability";
import {
  buildPartnerBookingUrl,
  getPartnerFromRequest,
  partnerCorsHeaders,
  partnerUnauthorizedMessage,
} from "@/lib/partner";
import { calculateDeposit, parseDateInput } from "@/lib/pricing";

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

export async function GET(request: Request) {
  const partnerAccount = await getPartnerFromRequest(request);
  if (!partnerAccount) {
    return corsJson(
      request,
      { error: partnerUnauthorizedMessage() },
      401,
    );
  }
  const partner = partnerAccount.slug;

  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = Number(searchParams.get("guests") ?? "0");

  if (!checkIn || !checkOut) {
    return corsJson(request, { error: "checkIn and checkOut are required" }, 400);
  }

  if (!Number.isFinite(guests) || guests < 1) {
    return corsJson(request, { error: "guests must be at least 1" }, 400);
  }

  const checkInDate = parseDateInput(checkIn);
  const checkOutDate = parseDateInput(checkOut);

  if (checkOutDate <= checkInDate) {
    return corsJson(request, { error: "checkOut must be after checkIn" }, 400);
  }

  const available = await getAvailableRooms(checkInDate, checkOutDate, guests);
  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const rooms = available.map(({ room, available: availableUnits }) => {
    const subtotal = room.pricePerPerson
      ? room.pricePerNight * guests * nights
      : room.pricePerNight * nights;

    return {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      beds: room.beds,
      capacityMin: room.capacityMin,
      capacityMax: room.capacityMax,
      pricePerNight: room.pricePerNight,
      pricePerPerson: room.pricePerPerson,
      imageUrl: room.imageUrl,
      availableUnits,
      subtotal,
      deposit: calculateDeposit(subtotal),
      bookUrl: buildPartnerBookingUrl({
        partner,
        checkIn,
        checkOut,
        guests,
        room: room.slug,
      }),
    };
  });

  return corsJson(request, {
    nights,
    partner: partner ?? null,
    bookUrl: buildPartnerBookingUrl({
      partner,
      checkIn,
      checkOut,
      guests,
    }),
    embedUrl: buildPartnerBookingUrl({
      partner,
      checkIn,
      checkOut,
      guests,
      embed: true,
    }),
    rooms,
  });
}
