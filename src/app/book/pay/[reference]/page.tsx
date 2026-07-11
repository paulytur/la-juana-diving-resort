import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingPayForm } from "@/components/booking-pay-form";
import { PageShell } from "@/components/page-shell";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { prisma } from "@/lib/db";
import { formatDateRange, formatPHP } from "@/lib/pricing";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type PayPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function BookingPayPage({ params }: PayPageProps) {
  const { reference } = await params;
  const [booking, paymentSettings] = await Promise.all([
    prisma.booking.findUnique({
      where: { reference },
      include: { roomType: true },
    }),
    getPaymentSettings(),
  ]);

  if (!booking || booking.status === "CANCELLED") {
    return (
      <PageShell>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
          <h1 className="section-title">Booking not found</h1>
          <p className="section-lead mt-4">
            This payment link may be invalid or expired.
          </p>
          <Link href="/book" className="btn-primary mt-8 inline-flex px-5 py-2.5">
            Start a new booking
          </Link>
        </main>
        <SiteFooter />
      </PageShell>
    );
  }

  if (booking.paymentReference && booking.paymentProofUrl) {
    redirect(`/book/confirmation/${reference}`);
  }

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="section-eyebrow">Complete payment</p>
          <h1 className="section-title mt-2">Pay your downpayment</h1>
          <p className="section-lead mt-4">
            Booking <span className="font-mono font-semibold">{reference}</span> ·{" "}
            {booking.roomType.name} · {formatDateRange(booking.checkIn, booking.checkOut)}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-line bg-white p-5 text-sm">
          <div className="flex flex-wrap justify-between gap-3">
            <span className="text-muted">Total stay</span>
            <span className="font-semibold">{formatPHP(booking.totalAmount)}</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-3 font-bold text-brand-blue">
            <span>Downpayment due (50%)</span>
            <span>{formatPHP(booking.depositAmount)}</span>
          </div>
        </div>

        <BookingPayForm
          reference={reference}
          guestEmail={booking.guestEmail}
          guestName={booking.guestName}
          depositAmount={booking.depositAmount}
          paymentSettings={paymentSettings}
        />
      </main>
      <SiteFooter />
    </PageShell>
  );
}
