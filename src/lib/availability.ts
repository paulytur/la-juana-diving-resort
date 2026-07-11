import { getDateRangeDays } from "./pricing";
import { prisma } from "./db";

export async function getBookedCountForRoom(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
) {
  const overlapping = await prisma.booking.findMany({
    where: {
      roomTypeId,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      guests: true,
      roomType: { select: { pricePerPerson: true } },
    },
  });

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { pricePerPerson: true, inventory: true },
  });

  if (!roomType) return { booked: 0, available: 0, inventory: 0 };

  if (roomType.pricePerPerson) {
    const bookedBeds = overlapping.reduce((sum, booking) => sum + booking.guests, 0);
    return {
      booked: bookedBeds,
      available: Math.max(roomType.inventory - bookedBeds, 0),
      inventory: roomType.inventory,
    };
  }

  return {
    booked: overlapping.length,
    available: Math.max(roomType.inventory - overlapping.length, 0),
    inventory: roomType.inventory,
  };
}

export async function isRoomAvailable(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  guests: number,
) {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId, isActive: true },
  });
  if (!roomType) return false;

  if (guests < roomType.capacityMin || guests > roomType.capacityMax) {
    return false;
  }

  const { available } = await getBookedCountForRoom(roomTypeId, checkIn, checkOut);
  const unitsNeeded = roomType.pricePerPerson ? guests : 1;
  return available >= unitsNeeded;
}

export async function getAvailableRooms(
  checkIn: Date,
  checkOut: Date,
  guests: number,
) {
  const rooms = await prisma.roomType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const results = [];

  for (const room of rooms) {
    const fitsCapacity =
      guests >= room.capacityMin && guests <= room.capacityMax;
    if (!fitsCapacity) continue;

    const { available } = await getBookedCountForRoom(
      room.id,
      checkIn,
      checkOut,
    );
    const unitsNeeded = room.pricePerPerson ? guests : 1;

    if (available >= unitsNeeded) {
      results.push({ room, available });
    }
  }

  return results;
}

export async function getAvailabilityByDate(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
) {
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    select: { inventory: true, pricePerPerson: true },
  });
  if (!roomType) return [];

  const days = getDateRangeDays(checkIn, checkOut);
  const bookings = await prisma.booking.findMany({
    where: {
      roomTypeId,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    select: {
      checkIn: true,
      checkOut: true,
      guests: true,
    },
  });

  return days.map((day) => {
    let booked = 0;
    for (const booking of bookings) {
      if (booking.checkIn <= day && booking.checkOut > day) {
        booked += roomType.pricePerPerson ? booking.guests : 1;
      }
    }
    return {
      date: day,
      booked,
      available: Math.max(roomType.inventory - booked, 0),
      inventory: roomType.inventory,
    };
  });
}
