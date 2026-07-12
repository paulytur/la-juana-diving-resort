import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBookingTable } from "@/components/admin-booking-table";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type AdminBookingsPageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
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
        action={
          <Link href="/admin/bookings/new" className="btn-primary px-5 py-2.5 text-sm">
            + Walk-in booking
          </Link>
        }
      />
      {params.created && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Walk-in booking created — reference{" "}
          <span className="font-mono font-bold">{params.created}</span>
        </p>
      )}
      <AdminBookingTable bookings={bookings} pendingCount={pendingCount} />
    </div>
  );
}
