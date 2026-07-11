"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PaymentReceiptUpload } from "@/components/payment-receipt-upload";
import { formatPHP } from "@/lib/pricing";
import type { PaymentSettings } from "@/lib/settings";

export type PartnerPaymentBooking = {
  reference: string;
  guestName: string;
  guestEmail: string;
  depositAmount: number;
  totalAmount: number;
  roomName: string;
  stayDates: string;
  guests: number;
  partnerName: string | null;
};

type PartnerPaymentFormProps = {
  booking: PartnerPaymentBooking;
  paymentSettings: PaymentSettings;
  embedMode?: boolean;
};

const STEPS = ["Transfer via bank or e-wallet", "Upload receipt"] as const;

export function PartnerPaymentForm({
  booking,
  paymentSettings,
  embedMode = false,
}: PartnerPaymentFormProps) {
  const router = useRouter();

  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentProofUrl) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/bookings/${booking.reference}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: booking.guestEmail,
          paymentProofUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit payment");
      }
      router.push(`/book/confirmation/${booking.reference}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit payment",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedMode ? "space-y-6" : "space-y-8"}>
      <ol className="flex flex-wrap gap-3">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue-light px-4 py-2 text-sm font-semibold text-brand-blue"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-xs text-white">
              {index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <section className="surface-card space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-bold text-brand-blue">Step 1 — Bank transfer</h2>
          <p className="mt-1 text-sm text-muted">
            Hi {booking.guestName.split(" ")[0]}, transfer{" "}
            <strong className="text-brand-blue">{formatPHP(booking.depositAmount)}</strong>{" "}
            (50% downpayment) to La Juana via bank or e-wallet, then upload your receipt
            below.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-brand-blue/20 bg-brand-yellow-soft/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Amount to transfer
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-blue">
            {formatPHP(booking.depositAmount)}
          </p>
          <p className="mt-1 text-sm text-muted">
            50% of {formatPHP(booking.totalAmount)} total stay
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Account name
            </p>
            <div className="mt-2 flex items-start justify-between gap-2">
              <p className="font-semibold text-brand-blue">
                {paymentSettings.accountName || "Contact La Juana for account details"}
              </p>
              {paymentSettings.accountName && (
                <button
                  type="button"
                  onClick={() => copyText("name", paymentSettings.accountName)}
                  className="shrink-0 text-xs font-semibold text-brand-blue hover:underline"
                >
                  {copied === "name" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Account number
            </p>
            <div className="mt-2 flex items-start justify-between gap-2">
              <p className="font-mono font-semibold text-brand-blue">
                {paymentSettings.accountNumber || "—"}
              </p>
              {paymentSettings.accountNumber && (
                <button
                  type="button"
                  onClick={() => copyText("number", paymentSettings.accountNumber)}
                  className="shrink-0 text-xs font-semibold text-brand-blue hover:underline"
                >
                  {copied === "number" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>
        </div>

        {paymentSettings.qrImageUrl && (
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-sm font-semibold text-brand-blue">
              Or scan QR (InstaPay / e-wallet)
            </p>
            <div className="relative mx-auto mt-3 aspect-square w-full max-w-[220px] overflow-hidden rounded-xl border border-line">
              <Image
                src={paymentSettings.qrImageUrl}
                alt="Payment QR code"
                fill
                className="object-contain p-2"
                sizes="220px"
              />
            </div>
          </div>
        )}

        {paymentSettings.instructions && (
          <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
            {paymentSettings.instructions}
          </p>
        )}
      </section>

      <section className="surface-card space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-bold text-brand-blue">Step 2 — Upload receipt</h2>
          <p className="mt-1 text-sm text-muted">
            Upload a screenshot of your successful bank transfer or e-wallet payment.
          </p>
        </div>

        <PaymentReceiptUpload
          value={paymentProofUrl}
          onChange={setPaymentProofUrl}
          disabled={submitting}
        />
      </section>

      {submitError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !paymentProofUrl}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit receipt"}
      </button>
    </form>
  );
}
