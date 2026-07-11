import { isRoomAvailable } from "@/lib/availability";
import { prisma } from "@/lib/db";
import {
  calculateBookingTotal,
  calculateDeposit,
  generateBookingReference,
  parseDateInput,
} from "@/lib/pricing";

export type CreateBookingInput = {
  roomTypeId: string;
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
};

export async function createBooking(input: CreateBookingInput) {
  const checkIn = parseDateInput(input.checkIn);
  const checkOut = parseDateInput(input.checkOut);

  if (checkOut <= checkIn) {
    throw new BookingError("Check-out must be after check-in", 400);
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: input.roomTypeId, isActive: true },
  });
  if (!roomType) {
    throw new BookingError("Room not found", 404);
  }

  if (input.guests < roomType.capacityMin || input.guests > roomType.capacityMax) {
    throw new BookingError(
      `${roomType.name} accommodates ${roomType.capacityMin}–${roomType.capacityMax} guests`,
      400,
    );
  }

  const available = await isRoomAvailable(
    input.roomTypeId,
    checkIn,
    checkOut,
    input.guests,
  );
  if (!available) {
    throw new BookingError("Selected room is not available for those dates", 409);
  }

  const pets = input.pets ?? 0;
  const dayTourGuests = input.dayTourGuests ?? 0;

  const pricing = calculateBookingTotal({
    roomType,
    checkIn,
    checkOut,
    guests: input.guests,
    pets,
    dayTourGuests,
  });

  const booking = await prisma.booking.create({
    data: {
      reference: generateBookingReference(),
      roomTypeId: input.roomTypeId,
      checkIn,
      checkOut,
      guests: input.guests,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      specialRequests: input.specialRequests,
      pets,
      dayTourGuests,
      subtotal: pricing.subtotal,
      petFee: pricing.petFee,
      dayTourFee: pricing.dayTourFee,
      totalAmount: pricing.totalAmount,
      nights: pricing.nights,
      depositAmount: calculateDeposit(pricing.totalAmount),
      paymentReference: input.paymentReference,
      paymentProofUrl: input.paymentProofUrl,
      partnerSource: input.partnerSource,
    },
    include: { roomType: true },
  });

  return booking;
}

export class BookingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
