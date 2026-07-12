import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminWalkInBookingForm } from "@/components/admin-walk-in-booking-form";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminNewWalkInPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const rooms = await prisma.roomType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Walk-in booking"
        description="Create a reservation for a guest at the front desk. Payment is optional — confirm immediately for guests who pay on-site."
        action={
          <Link href="/admin/bookings" className="btn-secondary px-5 py-2.5 text-sm">
            ← Back to bookings
          </Link>
        }
      />
      <AdminWalkInBookingForm rooms={rooms} />
    </div>
  );
}
