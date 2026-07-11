import type { Booking, RoomType } from "@/generated/prisma/client";
import { getSiteUrl } from "@/lib/partner-client";
import { formatDateRange } from "@/lib/pricing";

export type BookingWithRoom = Booking & { roomType: RoomType };

export function formatPartnerBooking(booking: BookingWithRoom) {
  const paymentComplete = Boolean(
    booking.paymentReference && booking.paymentProofUrl,
  );

  return {
    reference: booking.reference,
    status: booking.status,
    partner: booking.partnerSource,
    guest: {
      name: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
    },
    room: {
      slug: booking.roomType.slug,
      name: booking.roomType.name,
    },
    stay: {
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      dates: formatDateRange(booking.checkIn, booking.checkOut),
      guests: booking.guests,
      nights: booking.nights,
      pets: booking.pets,
      dayTourGuests: booking.dayTourGuests,
      specialRequests: booking.specialRequests,
    },
    pricing: {
      subtotal: booking.subtotal,
      petFee: booking.petFee,
      dayTourFee: booking.dayTourFee,
      totalAmount: booking.totalAmount,
      depositAmount: booking.depositAmount,
      balanceDue: booking.totalAmount - booking.depositAmount,
    },
    payment: {
      completed: paymentComplete,
      reference: booking.paymentReference,
      proofUrl: booking.paymentProofUrl,
    },
    urls: {
      confirmation: `${getSiteUrl()}/book/confirmation/${booking.reference}`,
      payment: paymentComplete
        ? null
        : `${getSiteUrl()}/book/pay/${booking.reference}`,
      invoice:
        booking.status === "CONFIRMED" || booking.status === "COMPLETED"
          ? `${getSiteUrl()}/api/bookings/${booking.reference}/invoice`
          : null,
    },
    createdAt: booking.createdAt.toISOString(),
  };
}
