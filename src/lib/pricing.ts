import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import type { RoomType } from "@/generated/prisma/client";
import { DEPOSIT_RATE, FEES } from "./constants";

export function formatPHP(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** WinAnsi-safe currency for pdf-lib standard fonts (no peso sign). */
export function formatPHPForPdf(amount: number) {
  const formatted = new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `PHP ${formatted}`;
}

export function formatDateRange(checkIn: Date, checkOut: Date) {
  return `${format(checkIn, "MMM d, yyyy")} – ${format(checkOut, "MMM d, yyyy")}`;
}

/** WinAnsi-safe date range for pdf-lib standard fonts (ASCII hyphen). */
export function formatDateRangeForPdf(checkIn: Date, checkOut: Date) {
  return `${format(checkIn, "MMM d, yyyy")} - ${format(checkOut, "MMM d, yyyy")}`;
}

export function calculateNights(checkIn: Date, checkOut: Date) {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  return Math.max(nights, 0);
}

export function calculateBookingTotal({
  roomType,
  checkIn,
  checkOut,
  guests,
  pets,
  dayTourGuests,
}: {
  roomType: Pick<RoomType, "pricePerNight" | "pricePerPerson">;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  pets: number;
  dayTourGuests: number;
}) {
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = roomType.pricePerPerson
    ? roomType.pricePerNight * guests * nights
    : roomType.pricePerNight * nights;
  const petFee = pets * FEES.pet;
  const dayTourFee = dayTourGuests * FEES.dayTour;
  const totalAmount = subtotal + petFee + dayTourFee;

  return { nights, subtotal, petFee, dayTourFee, totalAmount };
}

export function calculateDeposit(totalAmount: number) {
  return Math.round(totalAmount * DEPOSIT_RATE);
}

export function getDateRangeDays(checkIn: Date, checkOut: Date) {
  if (checkOut <= checkIn) return [];
  return eachDayOfInterval({
    start: checkIn,
    end: new Date(checkOut.getTime() - 24 * 60 * 60 * 1000),
  });
}

export function parseDateInput(value: string) {
  return parseISO(value);
}

export function generateBookingReference() {
  const datePart = format(new Date(), "yyMMdd");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LJ-${datePart}-${randomPart}`;
}
