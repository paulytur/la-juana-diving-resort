import type { BookingStatus } from "@/generated/prisma/client";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: "bg-brand-yellow text-brand-blue",
  CONFIRMED: "bg-brand-blue-light text-brand-blue",
  CANCELLED: "bg-red-50 text-red-700",
  COMPLETED: "bg-brand-yellow-soft text-brand-blue",
};

type AdminStatusBadgeProps = {
  status: BookingStatus;
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        STATUS_CLASS[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
