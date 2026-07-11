import { isRoomAvailable } from "@/lib/availability";
import { prisma } from "@/lib/db";
import {
  calculateBookingTotal,
  calculateDeposit,
  parseDateInput,
} from "@/lib/pricing";

export type CheckoutContext = {
  room: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    beds: string;
    capacityMin: number;
    capacityMax: number;
    pricePerNight: number;
    pricePerPerson: boolean;
    imageUrl: string | null;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
};

export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getCheckoutContext(input: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets?: number;
  dayTourGuests?: number;
}): Promise<CheckoutContext> {
  const checkIn = parseDateInput(input.checkIn);
  const checkOut = parseDateInput(input.checkOut);

  if (checkOut <= checkIn) {
    throw new CheckoutError("Check-out must be after check-in", 400);
  }

  const room = await prisma.roomType.findUnique({
    where: { slug: input.roomSlug, isActive: true },
  });

  if (!room) {
    throw new CheckoutError("Room not found", 404);
  }

  if (input.guests < room.capacityMin || input.guests > room.capacityMax) {
    throw new CheckoutError(
      `${room.name} accommodates ${room.capacityMin}–${room.capacityMax} guests`,
      400,
    );
  }

  const available = await isRoomAvailable(
    room.id,
    checkIn,
    checkOut,
    input.guests,
  );

  if (!available) {
    throw new CheckoutError("This room is not available for those dates", 409);
  }

  const pets = input.pets ?? 0;
  const dayTourGuests = input.dayTourGuests ?? 0;

  const pricing = calculateBookingTotal({
    roomType: room,
    checkIn,
    checkOut,
    guests: input.guests,
    pets,
    dayTourGuests,
  });

  const depositAmount = calculateDeposit(pricing.totalAmount);

  return {
    room: {
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
    },
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    nights: pricing.nights,
    subtotal: pricing.subtotal,
    totalAmount: pricing.totalAmount,
    depositAmount,
    balanceDue: pricing.totalAmount - depositAmount,
  };
}
