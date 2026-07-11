import type { Booking, RoomType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { formatDateRange } from "@/lib/pricing";
import type { PartnerPaymentBooking } from "@/components/partner-payment-form";

type BookingWithRoom = Booking & { roomType: RoomType };

export async function getPaymentBooking(
  reference: string,
): Promise<(BookingWithRoom & { partnerDisplayName: string | null }) | null> {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { roomType: true },
  });

  if (!booking || booking.status === "CANCELLED") {
    return null;
  }

  let partnerDisplayName: string | null = null;
  if (booking.partnerSource) {
    const partner = await prisma.partner.findUnique({
      where: { slug: booking.partnerSource },
    });
    partnerDisplayName = partner?.name ?? booking.partnerSource;
  }

  return {
    ...booking,
    partnerDisplayName,
  };
}

export async function getPartnerPaymentBooking(reference: string) {
  const booking = await getPaymentBooking(reference);
  if (!booking?.partnerSource) return null;
  return booking;
}

export function toPartnerPaymentBooking(
  booking: BookingWithRoom & { partnerDisplayName: string | null },
): PartnerPaymentBooking {
  return {
    reference: booking.reference,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    depositAmount: booking.depositAmount,
    totalAmount: booking.totalAmount,
    roomName: booking.roomType.name,
    stayDates: formatDateRange(booking.checkIn, booking.checkOut),
    guests: booking.guests,
    partnerName: booking.partnerDisplayName,
  };
}
