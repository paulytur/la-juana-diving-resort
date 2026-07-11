import { redirect } from "next/navigation";
import { PartnerPaymentForm } from "@/components/partner-payment-form";
import { RESORT } from "@/lib/constants";
import { canPartnerUseEmbed } from "@/lib/partner";
import {
  getPartnerPaymentBooking,
  toPartnerPaymentBooking,
} from "@/lib/partner-payment-page";
import { formatPHP } from "@/lib/pricing";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type EmbedPartnerPayPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function EmbedPartnerPayPage({ params }: EmbedPartnerPayPageProps) {
  const { reference } = await params;
  const [booking, paymentSettings] = await Promise.all([
    getPartnerPaymentBooking(reference),
    getPaymentSettings(),
  ]);

  if (!booking) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="font-semibold text-brand-blue">Payment link not found</p>
        <p className="mt-2 text-sm text-muted">Invalid or non-partner booking.</p>
      </main>
    );
  }

  if (booking.paymentProofUrl) {
    redirect(`/book/confirmation/${reference}`);
  }

  if (!canPartnerUseEmbed(booking.partnerSource)) {
    redirect(`/partner/pay/${reference}`);
  }

  const paymentBooking = toPartnerPaymentBooking(booking);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 border-b border-line pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
          {RESORT.name} · Partner payment
        </p>
        <h1 className="mt-1 text-xl font-bold text-brand-blue">
          Upload bank transfer receipt
        </h1>
        <p className="mt-2 text-sm text-muted">
          Transfer {formatPHP(booking.depositAmount)} (50% downpayment), then upload your
          screenshot.
        </p>
        {booking.partnerDisplayName && (
          <span className="mt-3 inline-block rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted">
            Via {booking.partnerDisplayName}
          </span>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-white p-4 text-sm">
        <p className="font-semibold text-brand-blue">{paymentBooking.roomName}</p>
        <p className="mt-1 text-muted">{paymentBooking.stayDates}</p>
        <div className="mt-3 flex justify-between font-bold text-brand-blue">
          <span>Transfer amount (50%)</span>
          <span>{formatPHP(booking.depositAmount)}</span>
        </div>
      </div>

      <PartnerPaymentForm
        booking={paymentBooking}
        paymentSettings={paymentSettings}
        embedMode
      />
    </main>
  );
}
