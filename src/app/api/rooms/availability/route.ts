import { NextResponse } from "next/server";
import { getAvailableRooms } from "@/lib/availability";
import { calculateDeposit, parseDateInput } from "@/lib/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = Number(searchParams.get("guests") ?? "0");

  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "Dates are required" }, { status: 400 });
  }

  if (!Number.isFinite(guests) || guests < 1) {
    return NextResponse.json({ error: "Invalid guest count" }, { status: 400 });
  }

  const checkInDate = parseDateInput(checkIn);
  const checkOutDate = parseDateInput(checkOut);

  if (checkOutDate <= checkInDate) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
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
    };
  });

  return NextResponse.json({ nights, rooms });
}
