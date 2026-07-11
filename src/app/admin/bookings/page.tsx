import { redirect } from "next/navigation";
import { AdminBookingTable } from "@/components/admin-booking-table";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const bookings = await prisma.booking.findMany({
    include: { roomType: true },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Management"
        title="Bookings"
        description="Review requests, confirm reservations, and update booking status."
      />
      <AdminBookingTable bookings={bookings} pendingCount={pendingCount} />
    </div>
  );
}
