import type { Booking, BookingStatus } from "@/generated/prisma/client";
import type { BookingWithRoom } from "@/lib/partner-booking";
import { getSiteUrl } from "@/lib/partner-client";
import {
  buildPartnerCheckoutUrl,
  buildPartnerPaymentUrl,
  canPartnerUseEmbed,
} from "@/lib/partner";

export type PartnerSyncStatus =
  | "AWAITING_DEPOSIT"
  | "PAYMENT_SUBMITTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type PartnerBookingAction = {
  type: "payment" | "receipt" | "invoice" | "confirmation" | "status";
  label: string;
  url: string;
};

export function getPartnerSyncStatus(booking: Booking): PartnerSyncStatus {
  if (booking.status === "CANCELLED") return "CANCELLED";
  if (booking.status === "COMPLETED") return "COMPLETED";
  if (booking.status === "CONFIRMED") return "CONFIRMED";
  if (booking.paymentProofUrl) return "PAYMENT_SUBMITTED";
  return "AWAITING_DEPOSIT";
}

export function needsAdminAction(booking: Booking) {
  return booking.status === "PENDING" && Boolean(booking.paymentProofUrl);
}

export function isAwaitingDeposit(booking: Booking) {
  return booking.status === "PENDING" && !booking.paymentProofUrl;
}

export function getPartnerActions(booking: BookingWithRoom): PartnerBookingAction[] {
  const actions: PartnerBookingAction[] = [];
  const paymentComplete = Boolean(booking.paymentProofUrl);
  const paymentUrl = paymentComplete
    ? null
    : buildPartnerPaymentUrl(booking.reference, false, booking.partnerSource);

  if (paymentUrl) {
    actions.push({
      type: "payment",
      label: "Open payment page",
      url: paymentUrl,
    });

    const embedPayment =
      canPartnerUseEmbed(booking.partnerSource) &&
      buildPartnerPaymentUrl(booking.reference, true, booking.partnerSource);
    if (embedPayment) {
      actions.push({
        type: "payment",
        label: "Embed payment",
        url: embedPayment,
      });
    }
  }

  if (booking.paymentProofUrl) {
    actions.push({
      type: "receipt",
      label: "View receipt",
      url: booking.paymentProofUrl,
    });
  }

  const invoiceUrl =
    booking.status === "CONFIRMED" || booking.status === "COMPLETED"
      ? `${getSiteUrl()}/api/bookings/${booking.reference}/invoice`
      : null;

  if (invoiceUrl) {
    actions.push({
      type: "invoice",
      label: "Download invoice",
      url: invoiceUrl,
    });
  }

  actions.push({
    type: "confirmation",
    label: "View confirmation",
    url: `${getSiteUrl()}/book/confirmation/${booking.reference}`,
  });

  actions.push({
    type: "status",
    label: "Refresh status",
    url: `${getSiteUrl()}/api/partner/bookings?reference=${encodeURIComponent(booking.reference)}`,
  });

  return actions;
}

export function summarizePartnerBookings(bookings: Booking[]) {
  return {
    needAction: bookings.filter(needsAdminAction).length,
    awaitingDeposit: bookings.filter(isAwaitingDeposit).length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    total: bookings.length,
  };
}

export function matchesPartnerSyncFilter(
  booking: Booking,
  filter: PartnerSyncStatus | "ALL",
) {
  if (filter === "ALL") return true;
  return getPartnerSyncStatus(booking) === filter;
}

export function bookingMatchesSearch(booking: Booking, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
    booking.reference,
    booking.partnerBookingReference ?? "",
    booking.partnerSource ?? "",
  ].some((value) => value.toLowerCase().includes(needle));
}

export function statusFromLegacyFilter(
  filter: string,
): BookingStatus | PartnerSyncStatus | "ALL" | "NEED_ACTION" | "AWAITING" {
  switch (filter.toUpperCase()) {
    case "PENDING":
    case "NEED_ACTION":
      return "NEED_ACTION";
    case "AWAITING":
    case "AWAITING_DEPOSIT":
      return "AWAITING_DEPOSIT";
    case "PAYMENT_SUBMITTED":
      return "PAYMENT_SUBMITTED";
    case "CONFIRMED":
    case "COMPLETED":
    case "CANCELLED":
      return filter.toUpperCase() as BookingStatus;
    default:
      return "ALL";
  }
}

export function filterBookingsForAdmin(
  bookings: Booking[],
  filter: string,
  search: string,
) {
  const normalized = statusFromLegacyFilter(filter);

  return bookings.filter((booking) => {
    if (!bookingMatchesSearch(booking, search)) return false;

    if (normalized === "ALL") return true;
    if (normalized === "NEED_ACTION") return needsAdminAction(booking);
    if (normalized === "AWAITING_DEPOSIT") return isAwaitingDeposit(booking);
    if (normalized === "PAYMENT_SUBMITTED") {
      return getPartnerSyncStatus(booking) === "PAYMENT_SUBMITTED";
    }
    return booking.status === normalized;
  });
}
