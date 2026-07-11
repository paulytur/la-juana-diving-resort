"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Booking, RoomType } from "@/generated/prisma/client";
import { AdminEmptyState, AdminFeedback } from "@/components/admin-feedback";
import { AdminStatusBadge } from "@/components/admin-status-badge";
import { formatDateRange, formatPHP } from "@/lib/pricing";
import { cn } from "@/lib/cn";

type BookingWithRoom = Booking & { roomType: RoomType };

type AdminBookingTableProps = {
  bookings: BookingWithRoom[];
  pendingCount: number;
};

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function AdminBookingTable({
  bookings,
  pendingCount,
}: AdminBookingTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>(
    pendingCount > 0 ? "PENDING" : "ALL",
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const filtered = useMemo(() => {
    if (filter === "ALL") return bookings;
    return bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  async function updateBooking(
    bookingId: string,
    status: Booking["status"],
  ) {
    setUpdatingId(bookingId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Update failed");
      }
      setFeedback({
        message:
          status === "CONFIRMED"
            ? "Booking confirmed. Invoice generated."
            : "Booking updated.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Update failed",
        tone: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {feedback && <AdminFeedback message={feedback.message} tone={feedback.tone} />}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter bookings">
        {FILTERS.map((item) => {
          const count =
            item.id === "ALL"
              ? bookings.length
              : bookings.filter((b) => b.status === item.id).length;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filter === item.id
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-line bg-white text-ink hover:border-brand-blue hover:text-brand-blue",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.65rem]",
                  filter === item.id
                    ? "bg-white/20 text-white"
                    : "bg-brand-yellow-soft text-brand-blue",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="No bookings in this view"
          description="Try another filter or wait for new reservation requests."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <article key={booking.id} className="surface-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-brand-blue">{booking.guestName}</p>
                  <p className="text-sm text-muted">{booking.reference}</p>
                </div>
                <AdminStatusBadge status={booking.status} />
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Room
                  </dt>
                  <dd className="mt-1 font-medium text-brand-blue">
                    {booking.roomType.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Dates
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatDateRange(booking.checkIn, booking.checkOut)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Guests
                  </dt>
                  <dd className="mt-1 font-medium">{booking.guests}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Total
                  </dt>
                  <dd className="mt-1 font-bold text-brand-blue">
                    {formatPHP(booking.totalAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Email
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${booking.guestEmail}`}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      {booking.guestEmail}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Phone
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${booking.guestPhone}`}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      {booking.guestPhone}
                    </a>
                  </dd>
                </div>
                {booking.pets > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Pets
                    </dt>
                    <dd className="mt-1 font-medium">{booking.pets}</dd>
                  </div>
                )}
                {booking.dayTourGuests > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Day tour
                    </dt>
                    <dd className="mt-1 font-medium">{booking.dayTourGuests} guests</dd>
                  </div>
                )}
              </dl>

              {booking.specialRequests && (
                <div className="mt-4 rounded-xl border border-brand-yellow bg-brand-yellow-soft px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
                    Special requests
                  </p>
                  <p className="mt-1 text-sm text-ink">{booking.specialRequests}</p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-line bg-brand-yellow-soft/40 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
                  Payment
                </p>
                <div className="mt-2 flex flex-wrap items-start gap-4">
                  {booking.paymentProofUrl ? (
                    <a
                      href={booking.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-white"
                    >
                      <Image
                        src={booking.paymentProofUrl}
                        alt="Payment receipt"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </a>
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-line bg-white px-2 text-center text-[0.65rem] text-muted">
                      No receipt
                    </div>
                  )}
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Downpayment (50%)
                      </dt>
                      <dd className="mt-0.5 font-bold text-brand-blue">
                        {formatPHP(booking.depositAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Reference no.
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {booking.paymentReference ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {booking.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={updatingId === booking.id}
                    onClick={() => updateBooking(booking.id, "CONFIRMED")}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                  >
                    Confirm booking
                  </button>
                )}
                {booking.status === "CONFIRMED" && (
                  <>
                    <a
                      href={`/api/admin/bookings/${booking.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Download invoice
                    </a>
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => updateBooking(booking.id, "COMPLETED")}
                      className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
                    >
                      Mark completed
                    </button>
                  </>
                )}
                {booking.status === "COMPLETED" && booking.invoiceUrl && (
                  <a
                    href={`/api/admin/bookings/${booking.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Download invoice
                  </a>
                )}
                {booking.status !== "CANCELLED" &&
                  booking.status !== "COMPLETED" && (
                    <button
                      type="button"
                      disabled={updatingId === booking.id}
                      onClick={() => updateBooking(booking.id, "CANCELLED")}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
