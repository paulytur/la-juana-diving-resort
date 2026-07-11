"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/form-fields";
import type { PaymentSettings } from "@/lib/settings";
import { formatPHP } from "@/lib/pricing";

type BookingPayFormProps = {
  reference: string;
  guestEmail: string;
  guestName: string;
  depositAmount: number;
  paymentSettings: PaymentSettings;
};

export function BookingPayForm({
  reference,
  guestEmail,
  guestName,
  depositAmount,
  paymentSettings,
}: BookingPayFormProps) {
  const router = useRouter();
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleProofUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    setProofError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      setPaymentProofUrl(data.imageUrl);
    } catch (error) {
      setProofError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingProof(false);
      if (proofInputRef.current) proofInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentReference.trim() || !paymentProofUrl) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/bookings/${reference}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail,
          paymentReference: paymentReference.trim(),
          paymentProofUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit payment");
      }
      router.push(`/book/confirmation/${reference}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit payment",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-line bg-brand-yellow-soft/40 px-5 py-4 text-sm">
        <p className="font-semibold text-brand-blue">
          Hi {guestName.split(" ")[0]}, pay your downpayment to confirm
        </p>
        <p className="mt-1 text-muted">
          Amount due now:{" "}
          <strong className="text-brand-blue">{formatPHP(depositAmount)}</strong>{" "}
          (50% deposit)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-brand-blue">Scan to pay</h2>
          {paymentSettings.qrImageUrl ? (
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-xl border border-line bg-white">
              <Image
                src={paymentSettings.qrImageUrl}
                alt="Payment QR code"
                fill
                className="object-contain p-3"
                sizes="320px"
              />
            </div>
          ) : (
            <p className="text-sm text-muted">QR code not configured yet.</p>
          )}
          {paymentSettings.accountName && (
            <p className="text-sm">
              <span className="font-semibold text-brand-blue">Account:</span>{" "}
              {paymentSettings.accountName}
            </p>
          )}
          {paymentSettings.accountNumber && (
            <p className="text-sm">
              <span className="font-semibold text-brand-blue">Number:</span>{" "}
              {paymentSettings.accountNumber}
            </p>
          )}
          {paymentSettings.instructions && (
            <p className="text-sm text-muted">{paymentSettings.instructions}</p>
          )}
        </div>

        <div className="space-y-4">
          <TextField
            label="Payment reference number"
            name="paymentReference"
            required
            placeholder="e.g. GCash ref 1234567890"
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
          />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-blue">
              Upload payment receipt
            </p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-brand-yellow-soft">
                {paymentProofUrl ? (
                  <Image
                    src={paymentProofUrl}
                    alt="Payment receipt"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
                    No receipt yet
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProofUpload}
                  disabled={uploadingProof}
                  className="text-sm"
                />
                {uploadingProof && (
                  <p className="mt-2 text-xs text-muted">Uploading...</p>
                )}
                {proofError && (
                  <p className="mt-2 text-xs text-red-600">{proofError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={
          submitting || !paymentReference.trim() || !paymentProofUrl || uploadingProof
        }
        className="btn-primary w-full py-3 text-base disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit payment"}
      </button>
    </form>
  );
}
