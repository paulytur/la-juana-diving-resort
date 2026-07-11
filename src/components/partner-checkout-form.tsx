"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form-fields";
import { PaymentReceiptUpload } from "@/components/payment-receipt-upload";
import { DEPOSIT_RATE, FEES } from "@/lib/constants";
import { getRoomImage } from "@/lib/images";
import { formatPHP } from "@/lib/pricing";
import type { PaymentSettings } from "@/lib/settings";
import type { CheckoutContext } from "@/lib/checkout";

type PartnerCheckoutFormProps = {
  checkout: CheckoutContext;
  partnerSource?: string;
  embedMode?: boolean;
  paymentSettings: PaymentSettings;
  initialGuestName?: string;
  initialGuestEmail?: string;
  initialGuestPhone?: string;
};

export function PartnerCheckoutForm({
  checkout,
  partnerSource,
  embedMode = false,
  paymentSettings,
  initialGuestName = "",
  initialGuestEmail = "",
  initialGuestPhone = "",
}: PartnerCheckoutFormProps) {
  const router = useRouter();

  const [contact, setContact] = useState({
    guestName: initialGuestName,
    guestEmail: initialGuestEmail,
    guestPhone: initialGuestPhone,
    specialRequests: "",
    pets: 0,
    dayTourGuests: 0,
  });

  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const petFee = contact.pets * FEES.pet;
    const dayTourFee = contact.dayTourGuests * FEES.dayTour;
    const total = checkout.subtotal + petFee + dayTourFee;
    const deposit = Math.round(total * DEPOSIT_RATE);
    return {
      petFee,
      dayTourFee,
      total,
      deposit,
      balance: total - deposit,
    };
  }, [checkout.subtotal, contact.pets, contact.dayTourGuests]);

  const contactComplete =
    contact.guestName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(contact.guestEmail) &&
    contact.guestPhone.trim().length >= 7;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contactComplete || !paymentProofUrl) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: checkout.room.id,
          checkIn: checkout.checkIn,
          checkOut: checkout.checkOut,
          guests: checkout.guests,
          ...contact,
          paymentProofUrl,
          ...(partnerSource ? { partnerSource } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to complete booking");
      }
      router.push(`/book/confirmation/${data.reference}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to complete booking",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedMode ? "space-y-6" : "space-y-8"}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <section className="surface-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              La Juana room
            </p>
            <div className="mt-3 flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-yellow-soft">
                <Image
                  src={getRoomImage(checkout.room.slug, checkout.room.imageUrl)}
                  alt={checkout.room.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue">{checkout.room.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {checkout.guests} guest{checkout.guests === 1 ? "" : "s"} ·{" "}
                  {checkout.nights} night{checkout.nights === 1 ? "" : "s"} · {checkout.room.beds}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {checkout.checkIn} → {checkout.checkOut}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card space-y-4 rounded-2xl p-5">
            <h3 className="font-bold text-brand-blue">Your contact details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                className="sm:col-span-2"
                label="Full name"
                name="guestName"
                required
                placeholder="Juan Dela Cruz"
                value={contact.guestName}
                onChange={(event) =>
                  setContact((c) => ({ ...c, guestName: event.target.value }))
                }
              />
              <TextField
                label="Email address"
                name="guestEmail"
                type="email"
                required
                placeholder="you@email.com"
                value={contact.guestEmail}
                onChange={(event) =>
                  setContact((c) => ({ ...c, guestEmail: event.target.value }))
                }
              />
              <TextField
                label="Phone number"
                name="guestPhone"
                type="tel"
                required
                placeholder="+63 9XX XXX XXXX"
                value={contact.guestPhone}
                onChange={(event) =>
                  setContact((c) => ({ ...c, guestPhone: event.target.value }))
                }
              />
              <SelectField
                label="Bringing pets?"
                hint={`${formatPHP(FEES.pet)} per pet.`}
                name="pets"
                value={contact.pets}
                onChange={(event) =>
                  setContact((c) => ({ ...c, pets: Number(event.target.value) }))
                }
              >
                {[0, 1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "No pets" : `${count} pet${count > 1 ? "s" : ""}`}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Day tour guests"
                hint={`${formatPHP(FEES.dayTour)} per person.`}
                name="dayTourGuests"
                value={contact.dayTourGuests}
                onChange={(event) =>
                  setContact((c) => ({
                    ...c,
                    dayTourGuests: Number(event.target.value),
                  }))
                }
              >
                {Array.from({ length: 11 }, (_, index) => index).map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "None" : `${count} guest${count > 1 ? "s" : ""}`}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                className="sm:col-span-2"
                label="Special requests"
                name="specialRequests"
                rows={2}
                placeholder="Early check-in, dietary needs, etc."
                value={contact.specialRequests}
                onChange={(event) =>
                  setContact((c) => ({
                    ...c,
                    specialRequests: event.target.value,
                  }))
                }
              />
            </div>
          </section>

          <section className="surface-card space-y-5 rounded-2xl p-5">
            <div>
              <h3 className="font-bold text-brand-blue">Pay your 50% downpayment</h3>
              <p className="mt-1 text-sm text-muted">
                Scan the QR code, pay {formatPHP(totals.deposit)}, then upload your receipt.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-brand-yellow-soft p-5 sm:flex-row sm:items-start">
              <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                {paymentSettings.qrImageUrl ? (
                  <Image
                    src={paymentSettings.qrImageUrl}
                    alt="Payment QR code"
                    fill
                    className="object-contain p-2"
                    sizes="192px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
                    Payment QR will be provided by the resort.
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-2xl font-bold text-brand-blue">
                  {formatPHP(totals.deposit)}
                </p>
                <p className="text-muted">50% of your total stay at La Juana</p>
                {paymentSettings.accountName && (
                  <p>
                    <span className="font-semibold">Account:</span>{" "}
                    {paymentSettings.accountName}
                  </p>
                )}
                {paymentSettings.accountNumber && (
                  <p>
                    <span className="font-semibold">Number:</span>{" "}
                    {paymentSettings.accountNumber}
                  </p>
                )}
                {paymentSettings.instructions && (
                  <p className="text-muted">{paymentSettings.instructions}</p>
                )}
              </div>
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
            disabled={submitting || !contactComplete || !paymentProofUrl}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit payment & confirm booking"}
          </button>
        </div>

        <aside className="sticky-summary">
          <div className="surface-card rounded-2xl border-brand-yellow bg-brand-yellow-soft p-5">
            <h3 className="text-lg font-bold text-brand-blue">Price summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Room ({checkout.nights} nights)</dt>
                <dd>{formatPHP(checkout.subtotal)}</dd>
              </div>
              {totals.petFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Pet fee</dt>
                  <dd>{formatPHP(totals.petFee)}</dd>
                </div>
              )}
              {totals.dayTourFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Day tour</dt>
                  <dd>{formatPHP(totals.dayTourFee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-brand-blue">
                <dt>Total stay</dt>
                <dd>{formatPHP(totals.total)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-blue">
                <dt>Pay now (50%)</dt>
                <dd>{formatPHP(totals.deposit)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Balance on arrival</dt>
                <dd>{formatPHP(totals.balance)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </form>
  );
}
