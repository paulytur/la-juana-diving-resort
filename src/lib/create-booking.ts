import { getBookedCountForRoom, isRoomAvailable } from "@/lib/availability";
import { prisma } from "@/lib/db";
import {
  distributeGuestsAcrossUnits,
  generateGroupReference,
  type RoomSelection,
  type RoomWithUnits,
} from "@/lib/multi-room";
import {
  calculateBookingTotal,
  calculateDeposit,
  generateBookingReference,
  parseDateInput,
} from "@/lib/pricing";

export type CreateBookingInput = {
  roomTypeId?: string;
  rooms?: RoomSelection[];
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  pets?: number;
  dayTourGuests?: number;
  paymentReference?: string;
  paymentProofUrl?: string;
  partnerSource?: string;
  partnerBookingReference?: string;
  status?: "PENDING" | "CONFIRMED";
  adminNotes?: string;
};

export type CreateBookingResult = {
  reference: string;
  groupReference: string | null;
  bookings: Awaited<ReturnType<typeof createSingleBookingRecord>>[];
  totalAmount: number;
  depositAmount: number;
};

export async function createBooking(input: CreateBookingInput) {
  if (input.rooms?.length) {
    return createBookingGroup(input);
  }

  if (!input.roomTypeId) {
    throw new BookingError("roomTypeId or rooms is required", 400);
  }

  const booking = await createSingleBookingRecord({
    ...input,
    roomTypeId: input.roomTypeId,
    groupReference: null,
    guests: input.guests,
    includeGroupFees: true,
  });

  return {
    reference: booking.reference,
    groupReference: null,
    bookings: [booking],
    totalAmount: booking.totalAmount,
    depositAmount: booking.depositAmount,
  };
}

async function createBookingGroup(input: CreateBookingInput) {
  const selections = input.rooms ?? [];
  if (selections.length === 0) {
    throw new BookingError("Select at least one room", 400);
  }

  const checkIn = parseDateInput(input.checkIn);
  const checkOut = parseDateInput(input.checkOut);

  if (checkOut <= checkIn) {
    throw new BookingError("Check-out must be after check-in", 400);
  }

  const roomTypes = await prisma.roomType.findMany({
    where: {
      id: { in: selections.map((item) => item.roomTypeId) },
      isActive: true,
    },
  });

  const roomById = new Map<string, RoomWithUnits>();

  for (const selection of selections) {
    const room = roomTypes.find((item) => item.id === selection.roomTypeId);
    if (!room) {
      throw new BookingError("Room not found", 404);
    }

    const { available: unitsLeft } = await getBookedCountForRoom(
      room.id,
      checkIn,
      checkOut,
    );

    if (selection.quantity < 1 || selection.quantity > unitsLeft) {
      throw new BookingError(`${room.name} does not have enough availability`, 409);
    }

    roomById.set(room.id, {
      id: room.id,
      slug: room.slug,
      name: room.name,
      capacityMin: room.capacityMin,
      capacityMax: room.capacityMax,
      pricePerNight: room.pricePerNight,
      pricePerPerson: room.pricePerPerson,
      availableUnits: unitsLeft,
    });
  }

  let units;
  try {
    units = distributeGuestsAcrossUnits(selections, roomById, input.guests);
  } catch (error) {
    throw new BookingError(
      error instanceof Error ? error.message : "Invalid room selection",
      400,
    );
  }

  const groupReference = units.length > 1 ? generateGroupReference() : null;
  const pets = input.pets ?? 0;
  const dayTourGuests = input.dayTourGuests ?? 0;

  const bookings = await prisma.$transaction(async () => {
    const created = [];
    for (let index = 0; index < units.length; index += 1) {
      const unit = units[index];
      const booking = await createSingleBookingRecord({
        ...input,
        roomTypeId: unit.roomTypeId,
        guests: unit.guests,
        groupReference,
        includeGroupFees: index === 0,
        pets: index === 0 ? pets : 0,
        dayTourGuests: index === 0 ? dayTourGuests : 0,
      });
      created.push(booking);
    }
    return created;
  });

  const totalAmount = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const depositAmount = bookings.reduce((sum, booking) => sum + booking.depositAmount, 0);

  return {
    reference: bookings[0].reference,
    groupReference,
    bookings,
    totalAmount,
    depositAmount,
  };
}

async function createSingleBookingRecord({
  roomTypeId,
  checkIn: checkInValue,
  checkOut: checkOutValue,
  guests,
  guestName,
  guestEmail,
  guestPhone,
  specialRequests,
  pets = 0,
  dayTourGuests = 0,
  paymentReference,
  paymentProofUrl,
  partnerSource,
  partnerBookingReference,
  groupReference,
  includeGroupFees,
  status = "PENDING",
  adminNotes,
}: CreateBookingInput & {
  roomTypeId: string;
  groupReference: string | null;
  includeGroupFees: boolean;
}) {
  const checkIn = parseDateInput(checkInValue);
  const checkOut = parseDateInput(checkOutValue);

  if (checkOut <= checkIn) {
    throw new BookingError("Check-out must be after check-in", 400);
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId, isActive: true },
  });
  if (!roomType) {
    throw new BookingError("Room not found", 404);
  }

  if (guests < roomType.capacityMin || guests > roomType.capacityMax) {
    throw new BookingError(
      `${roomType.name} accommodates ${roomType.capacityMin}–${roomType.capacityMax} guests per room`,
      400,
    );
  }

  const available = await isRoomAvailable(roomTypeId, checkIn, checkOut, guests);
  if (!available) {
    throw new BookingError("Selected room is not available for those dates", 409);
  }

  const pricing = calculateBookingTotal({
    roomType,
    checkIn,
    checkOut,
    guests,
    pets: includeGroupFees ? pets : 0,
    dayTourGuests: includeGroupFees ? dayTourGuests : 0,
  });

  return prisma.booking.create({
    data: {
      reference: generateBookingReference(),
      status,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      pets: includeGroupFees ? pets : 0,
      dayTourGuests: includeGroupFees ? dayTourGuests : 0,
      subtotal: pricing.subtotal,
      petFee: pricing.petFee,
      dayTourFee: pricing.dayTourFee,
      totalAmount: pricing.totalAmount,
      nights: pricing.nights,
      depositAmount: calculateDeposit(pricing.totalAmount),
      paymentReference,
      paymentProofUrl,
      partnerSource,
      partnerBookingReference,
      groupReference,
      adminNotes,
    },
    include: { roomType: true },
  });
}

export class BookingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
