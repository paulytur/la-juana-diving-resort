import type { Booking, RoomType } from "@/generated/prisma/client";
import { buildPartnerCheckoutUrl, buildPartnerPaymentUrl, canPartnerUseEmbed } from "@/lib/partner";
import { getSiteUrl } from "@/lib/partner-client";
import { formatDateRange } from "@/lib/pricing";

export type BookingWithRoom = Booking & { roomType: RoomType };

export function formatPartnerBooking(booking: BookingWithRoom) {
  const paymentComplete = Boolean(booking.paymentProofUrl);

  const paymentUrl = paymentComplete
    ? null
    : buildPartnerPaymentUrl(booking.reference, false, booking.partnerSource);

  const embedPayment =
    paymentComplete || !canPartnerUseEmbed(booking.partnerSource)
      ? null
      : buildPartnerPaymentUrl(booking.reference, true, booking.partnerSource);

  return {
    reference: booking.reference,
    status: booking.status,
    partner: booking.partnerSource,
    paymentUrl,
    redirectUrl: paymentUrl,
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
      payment: paymentUrl,
      embedPayment,
      checkout: paymentComplete
        ? null
        : buildPartnerCheckoutUrl({
            partner: booking.partnerSource ?? undefined,
            checkIn: booking.checkIn.toISOString().slice(0, 10),
            checkOut: booking.checkOut.toISOString().slice(0, 10),
            guests: booking.guests,
            room: booking.roomType.slug,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
          }),
      invoice:
        booking.status === "CONFIRMED" || booking.status === "COMPLETED"
          ? `${getSiteUrl()}/api/bookings/${booking.reference}/invoice`
          : null,
    },
    createdAt: booking.createdAt.toISOString(),
  };
}
