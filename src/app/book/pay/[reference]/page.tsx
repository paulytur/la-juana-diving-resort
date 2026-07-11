import Link from "next/link";
import { redirect } from "next/navigation";
import { PartnerPaymentForm } from "@/components/partner-payment-form";
import { PageShell } from "@/components/page-shell";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RESORT } from "@/lib/constants";
import {
  getPaymentBooking,
  toPartnerPaymentBooking,
} from "@/lib/partner-payment-page";
import { formatPHP } from "@/lib/pricing";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type PayPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function BookingPayPage({ params }: PayPageProps) {
  const { reference } = await params;
  const [booking, paymentSettings] = await Promise.all([
    getPaymentBooking(reference),
    getPaymentSettings(),
  ]);

  if (!booking) {
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

  if (booking.paymentProofUrl) {
    redirect(`/book/confirmation/${reference}`);
  }

  const paymentBooking = toPartnerPaymentBooking(booking);

  return (
    <PageShell>
      <SiteHeader />
      <main className="mobile-page mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="section-eyebrow">Complete payment</p>
          <h1 className="section-title mt-2">Upload your bank transfer receipt</h1>
          <p className="section-lead mt-4">
            Transfer <strong>{formatPHP(booking.depositAmount)}</strong> (50% downpayment)
            to {RESORT.name}, then upload your payment screenshot below.
          </p>
          {booking.partnerDisplayName && (
            <span className="mt-4 inline-block rounded-full border border-line bg-brand-yellow-soft px-3 py-1 text-xs font-medium text-muted">
              Booked via {booking.partnerDisplayName}
            </span>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-card rounded-2xl p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Booking
            </p>
            <p className="mt-2 font-bold text-brand-blue">{paymentBooking.roomName}</p>
            <p className="mt-1 text-muted">{paymentBooking.stayDates}</p>
            <p className="mt-1 break-all text-muted">
              {paymentBooking.guests} guest{paymentBooking.guests === 1 ? "" : "s"} · Ref{" "}
              {reference}
            </p>
          </div>
          <div className="surface-card rounded-2xl border-brand-yellow bg-brand-yellow-soft p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Due now
            </p>
            <p className="mt-2 text-2xl font-bold text-brand-blue">
              {formatPHP(booking.depositAmount)}
            </p>
            <p className="mt-1 text-muted">
              50% downpayment · {formatPHP(booking.totalAmount)} total
            </p>
          </div>
        </div>

        <PartnerPaymentForm booking={paymentBooking} paymentSettings={paymentSettings} />
      </main>
      <SiteFooter />
    </PageShell>
  );
}
