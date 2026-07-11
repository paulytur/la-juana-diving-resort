import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminStatusBadge } from "@/components/admin-status-badge";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPHP } from "@/lib/pricing";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [bookings, pendingCount, confirmedCount, revenue, roomCount, facilityCount] =
    await Promise.all([
      prisma.booking.findMany({
        include: { roomType: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { totalAmount: true },
      }),
      prisma.roomType.count({ where: { isActive: true } }),
      prisma.facility.count({ where: { isActive: true } }),
    ]);

  const firstName = session.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening at the resort today."
        action={
          pendingCount > 0 ? (
            <Link href="/admin/bookings" className="btn-primary px-5 py-2.5 text-sm">
              Review {pendingCount} pending
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Pending requests",
            value: String(pendingCount),
            hint: "Need your confirmation",
          },
          {
            label: "Confirmed stays",
            value: String(confirmedCount),
            hint: "Upcoming reservations",
          },
          {
            label: "Confirmed revenue",
            value: formatPHP(revenue._sum.totalAmount ?? 0),
            hint: "Confirmed + completed",
          },
        ].map((stat) => (
          <div key={stat.label} className="surface-card rounded-2xl p-5">
            <p className="section-eyebrow">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-blue">{stat.value}</p>
            <p className="input-hint mt-1">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold text-brand-blue">Quick actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/admin/bookings",
              label: "Bookings",
              text: "Review and confirm guest requests",
              stat: pendingCount > 0 ? `${pendingCount} pending` : "All caught up",
              alert: pendingCount > 0,
            },
            {
              href: "/admin/rooms",
              label: "Rooms",
              text: "Update photos and availability",
              stat: `${roomCount} active rooms`,
              alert: false,
            },
            {
              href: "/admin/facilities",
              label: "Facilities",
              text: "Manage resort gallery content",
              stat: `${facilityCount} on site`,
              alert: false,
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="surface-card surface-card-hover rounded-2xl p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-brand-blue">{link.label}</p>
                <span
                  className={`badge-pill text-xs ${link.alert ? "border-amber-300 bg-amber-50" : ""}`}
                >
                  {link.stat}
                </span>
              </div>
              <p className="input-hint mt-2">{link.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-blue">Recent bookings</h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
          >
            View all →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="font-bold text-brand-blue">No bookings yet</p>
            <p className="input-hint mt-2">New reservation requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-brand-blue">{booking.guestName}</p>
                  <p className="text-sm text-muted">
                    {booking.roomType.name} · {booking.reference}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-brand-blue">
                    {formatPHP(booking.totalAmount)}
                  </p>
                  <AdminStatusBadge status={booking.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
