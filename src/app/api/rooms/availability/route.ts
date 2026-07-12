import { NextResponse } from "next/server";
import { getAvailableRooms, getRoomsWithAvailability } from "@/lib/availability";
import { prisma } from "@/lib/db";
import {
  getMaxBookableGuests,
  getMaxSingleRoomCapacity,
  needsMultipleRooms,
  unitSubtotal,
} from "@/lib/multi-room";
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

  const allRooms = await prisma.roomType.findMany({
    where: { isActive: true },
    select: { capacityMax: true, inventory: true, pricePerPerson: true },
  });

  const maxSingleRoomCapacity = getMaxSingleRoomCapacity(allRooms);
  const maxBookableGuests = getMaxBookableGuests(allRooms);
  const multiRoom = needsMultipleRooms(guests, allRooms);

  if (guests > maxBookableGuests) {
    return NextResponse.json(
      {
        error: `We can accommodate up to ${maxBookableGuests} guests across available rooms. Please contact us for larger groups.`,
      },
      { status: 400 },
    );
  }

  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const available = multiRoom
    ? await getRoomsWithAvailability(checkInDate, checkOutDate)
    : await getAvailableRooms(checkInDate, checkOutDate, guests);

  const rooms = available.map((entry) => {
    const room = entry.room;
    const units =
      "availableUnits" in entry ? entry.availableUnits : entry.available;
    const fitsSingleRoom =
      !multiRoom &&
      guests >= room.capacityMin &&
      guests <= room.capacityMax &&
      units >= 1;
    const guestsForPreview = multiRoom
      ? Math.min(room.capacityMax, guests)
      : guests;
    const subtotal = unitSubtotal(room, nights, guestsForPreview);

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
      availableUnits: units,
      fitsSingleRoom,
      subtotal,
      deposit: calculateDeposit(subtotal),
      unitSubtotal: unitSubtotal(room, nights, room.pricePerPerson ? 1 : 1),
    };
  });

  return NextResponse.json({
    nights,
    guests,
    multiRoom,
    maxSingleRoomCapacity,
    maxBookableGuests,
    rooms,
  });
}
