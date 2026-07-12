import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RESORT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateRange, formatPHP } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type ConfirmationPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { reference } = await params;
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { roomType: true },
  });

  if (!booking) notFound();

  const groupBookings = booking.groupReference
    ? await prisma.booking.findMany({
        where: { groupReference: booking.groupReference },
        include: { roomType: true },
        orderBy: { createdAt: "asc" },
      })
    : [booking];

  const totalAmount = groupBookings.reduce((sum, item) => sum + item.totalAmount, 0);
  const depositAmount = groupBookings.reduce((sum, item) => sum + item.depositAmount, 0);
  const totalGuests = groupBookings.reduce((sum, item) => sum + item.guests, 0);

  return (
    <PageShell>
      <SiteHeader />
      <main className="mobile-page mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="surface-card rounded-[1.5rem] border-brand-yellow bg-brand-yellow-soft p-5 text-center sm:rounded-[2rem] sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-2xl font-bold text-white">
            ✓
          </div>
          <p className="section-eyebrow">You&apos;re all set!</p>
          <h1 className="section-title mt-3">
            Thanks, {booking.guestName.split(" ")[0]}!
          </h1>
          <p className="section-lead mt-4">
            Your booking request was received. Keep this reference handy:
          </p>
          <p className="mt-3 inline-block max-w-full break-all rounded-xl bg-white px-4 py-2 font-mono text-base font-bold text-brand-blue sm:px-5 sm:text-lg">
            {booking.groupReference ?? booking.reference}
          </p>
          {booking.groupReference && (
            <p className="mt-2 text-xs text-muted">
              Primary room reference: {booking.reference}
            </p>
          )}
        </div>

        <div className="surface-card mt-8 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-blue">What happens next?</h2>
          <ul className="mt-4 space-y-4 text-sm text-foreground">
            {booking.status === "PENDING" && (
              <>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    We verify your downpayment of{" "}
                    <strong>{formatPHP(booking.depositAmount)}</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    You&apos;ll hear from us at{" "}
                    <strong>{booking.guestEmail}</strong> or{" "}
                    <strong>{booking.guestPhone}</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    Once verified, your reservation is locked in. The balance of{" "}
                    <strong>
                      {formatPHP(booking.totalAmount - booking.depositAmount)}
                    </strong>{" "}
                    is due on arrival.
                  </span>
                </li>
              </>
            )}
            {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
              <>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    Your reservation is <strong>confirmed</strong>. Your downpayment
                    of <strong>{formatPHP(booking.depositAmount)}</strong> has been
                    verified.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    The balance of{" "}
                    <strong>
                      {formatPHP(booking.totalAmount - booking.depositAmount)}
                    </strong>{" "}
                    is due when you arrive.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-brand-blue" aria-hidden>
                    •
                  </span>
                  <span>
                    Download your invoice below for your records.
                  </span>
                </li>
              </>
            )}
          </ul>
          {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
            <a
              href={`/api/bookings/${booking.reference}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary touch-target mt-6 inline-flex w-full justify-center px-5 py-3 text-sm sm:w-auto sm:py-2.5"
            >
              Download invoice (PDF)
            </a>
          )}
        </div>

        <div className="surface-card mt-6 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-blue">Booking summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            {groupBookings.length > 1 && (
              <div className="rounded-xl border border-line bg-brand-yellow-soft px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Rooms booked
                </dt>
                <dd className="mt-2 space-y-1 font-medium text-brand-blue">
                  {groupBookings.map((item) => (
                    <p key={item.id}>
                      {item.roomType.name} · {item.guests} guest
                      {item.guests === 1 ? "" : "s"}
                    </p>
                  ))}
                </dd>
              </div>
            )}
            {[
              ...(groupBookings.length === 1
                ? ([["Room", booking.roomType.name]] as const)
                : []),
              ["Dates", formatDateRange(booking.checkIn, booking.checkOut)],
              ["Guests", String(totalGuests)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-line pb-3 last:border-0"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-right">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-line pt-4 text-base font-bold text-brand-blue">
              <dt>Total</dt>
              <dd>{formatPHP(totalAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm font-semibold text-brand-blue">
              <dt>Downpayment paid (50%)</dt>
              <dd>{formatPHP(depositAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm text-muted">
              <dt>Balance on arrival</dt>
              <dd>{formatPHP(totalAmount - depositAmount)}</dd>
            </div>
          </dl>
        </div>

        <div className="surface-card mt-6 rounded-2xl p-6 text-sm text-muted">
          <p>
            Need help sooner? Call{" "}
            <a
              href={`tel:${RESORT.phone}`}
              className="font-semibold text-brand-blue hover:underline"
            >
              {RESORT.phone}
            </a>{" "}
            or email {RESORT.email}.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary px-5 py-2.5">
            Back to home
          </Link>
          <Link href="/rooms" className="btn-secondary px-5 py-2.5">
            Browse rooms
          </Link>
        </div>
      </main>
      <SiteFooter />
    </PageShell>
  );
}
