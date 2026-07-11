"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form-fields";
import { FormSection } from "@/components/form-section";
import type { RoomType } from "@/generated/prisma/client";
import { PaymentReceiptUpload } from "@/components/payment-receipt-upload";
import { cn } from "@/lib/cn";
import { DEPOSIT_RATE, FEES } from "@/lib/constants";
import { getRoomImage } from "@/lib/images";
import { formatPHP } from "@/lib/pricing";
import type { PaymentSettings } from "@/lib/settings";

type AvailableRoom = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  beds: string;
  capacityMin: number;
  capacityMax: number;
  pricePerNight: number;
  pricePerPerson: boolean;
  imageUrl: string | null;
  availableUnits: number;
  subtotal: number;
  deposit: number;
};

type BookingFormProps = {
  rooms: RoomType[];
  initialRoomSlug?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  partnerSource?: string;
  embedMode?: boolean;
  autoSearch?: boolean;
  paymentSettings: PaymentSettings;
};

function guestRange(rooms: RoomType[]) {
  const min = Math.min(...rooms.map((room) => room.capacityMin), 1);
  const max = Math.max(...rooms.map((room) => room.capacityMax), 1);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

const STEPS = ["Dates & guests", "Choose a room", "Pay & confirm"] as const;

export function BookingForm({
  rooms,
  initialRoomSlug,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  partnerSource,
  embedMode = false,
  autoSearch = false,
  paymentSettings,
}: BookingFormProps) {
  const router = useRouter();

  const initialRoom = rooms.find((room) => room.slug === initialRoomSlug);

  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(
    initialGuests ?? initialRoom?.capacityMin ?? 1,
  );

  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [nights, setNights] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [contact, setContact] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
    pets: 0,
    dayTourGuests: 0,
  });

  const [paymentProofUrl, setPaymentProofUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const autoSearched = useRef(false);

  const today = new Date().toISOString().slice(0, 10);
  const checkOutMin = checkIn || today;
  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  const selectedRoom = availableRooms.find((room) => room.id === selectedRoomId);

  const searchAvailability = useCallback(async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests: String(guests),
      });
      const response = await fetch(`/api/rooms/availability?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load availability");
      }
      setAvailableRooms(data.rooms as AvailableRoom[]);
      setNights(data.nights as number);
      return data.rooms as AvailableRoom[];
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Could not load availability",
      );
      return [];
    } finally {
      setSearching(false);
    }
  }, [checkIn, checkOut, guests]);

  async function goToRooms() {
    if (!hasDates) return;
    const found = await searchAvailability();
    setSelectedRoomId((current) => {
      if (current && found.some((room) => room.id === current)) return current;
      const preferred = found.find((room) => room.slug === initialRoomSlug);
      return preferred?.id ?? "";
    });
    setStep(2);
  }

  useEffect(() => {
    if (
      !autoSearch ||
      autoSearched.current ||
      !checkIn ||
      !checkOut ||
      checkOut <= checkIn
    ) {
      return;
    }

    autoSearched.current = true;

    void (async () => {
      const found = await searchAvailability();
      setSelectedRoomId((current) => {
        if (current && found.some((room) => room.id === current)) return current;
        const preferred = found.find((room) => room.slug === initialRoomSlug);
        return preferred?.id ?? "";
      });
      setStep(2);
    })();
  }, [autoSearch, checkIn, checkOut, initialRoomSlug, searchAvailability]);

  const totals = (() => {
    if (!selectedRoom) return null;
    const petFee = contact.pets * FEES.pet;
    const dayTourFee = contact.dayTourGuests * FEES.dayTour;
    const total = selectedRoom.subtotal + petFee + dayTourFee;
    return {
      subtotal: selectedRoom.subtotal,
      petFee,
      dayTourFee,
      total,
      deposit: Math.round(total * DEPOSIT_RATE),
      balance: total - Math.round(total * DEPOSIT_RATE),
    };
  })();

  const contactComplete =
    contact.guestName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(contact.guestEmail) &&
    contact.guestPhone.trim().length >= 7;

  async function handleSubmit() {
    if (!selectedRoom || !paymentProofUrl) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: selectedRoom.id,
          checkIn,
          checkOut,
          guests,
          ...contact,
          paymentProofUrl,
          ...(partnerSource ? { partnerSource } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create booking");
      }
      router.push(`/book/confirmation/${data.reference}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create booking",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={embedMode ? "space-y-6" : "space-y-8"}>
      <ol className="flex flex-wrap gap-3">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === step;
          const done = stepNumber < step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : done
                    ? "border-brand-blue/30 bg-brand-blue-light text-brand-blue"
                    : "border-line bg-white text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  active
                    ? "bg-white text-brand-blue"
                    : done
                      ? "bg-brand-blue text-white"
                      : "bg-brand-yellow-soft text-muted",
                )}
              >
                {done ? "✓" : stepNumber}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <FormSection
          title="When are you staying?"
          description="Choose your dates and how many guests are coming."
        >
          <div className="space-y-4">
            <div className="date-range-group">
              <p className="date-range-group__label">Stay dates</p>
              <DateField
                label="Check-in"
                name="checkIn"
                required
                value={checkIn}
                min={today}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  if (checkOut && checkOut <= event.target.value) {
                    setCheckOut("");
                  }
                }}
              />
              <DateField
                label="Check-out"
                name="checkOut"
                required
                value={checkOut}
                min={checkOutMin}
                disabled={!checkIn}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>

            <SelectField
              label="Number of guests"
              hint="We'll show rooms that fit your group size."
              name="guests"
              required
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            >
              {guestRange(rooms).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"}
                </option>
              ))}
            </SelectField>

            {searchError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {searchError}
              </p>
            )}

            <button
              type="button"
              disabled={!hasDates || searching}
              onClick={goToRooms}
              className="btn-primary w-full py-3.5 text-base"
            >
              {searching ? "Checking availability..." : "See available rooms"}
            </button>
            {!hasDates && (
              <p className="input-hint text-center">
                Select both check-in and check-out dates to continue.
              </p>
            )}
          </div>
        </FormSection>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <FormSection
            title="Available rooms"
            description={`${availableRooms.length} room${availableRooms.length === 1 ? "" : "s"} available for ${guests} guest${guests === 1 ? "" : "s"} · ${nights} night${nights === 1 ? "" : "s"}.`}
          >
            {availableRooms.length === 0 ? (
              <div className="rounded-xl border border-line bg-brand-yellow-soft px-4 py-6 text-center text-sm text-muted">
                <p>No rooms available for these dates and guest count.</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary mt-4 px-5 py-2.5 text-sm"
                >
                  Change dates or guests
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {availableRooms.map((room) => {
                  const selected = room.id === selectedRoomId;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-2xl border-[1.5px] bg-white text-left transition",
                        selected
                          ? "border-brand-blue ring-4 ring-brand-blue/10"
                          : "border-line hover:border-brand-blue/40",
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-yellow-soft">
                        <Image
                          src={getRoomImage(room.slug, room.imageUrl)}
                          alt={room.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-brand-blue">
                            {room.name}
                          </h3>
                          <span className="shrink-0 text-sm font-semibold text-brand-blue">
                            {room.pricePerPerson
                              ? `${formatPHP(room.pricePerNight)}/pax`
                              : `${formatPHP(room.pricePerNight)}/night`}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          Fits {room.capacityMin}–{room.capacityMax} · {room.beds}
                        </p>
                        {room.pricePerPerson && (
                          <p className="text-xs text-muted">
                            {room.availableUnits} bed
                            {room.availableUnits === 1 ? "" : "s"} left
                          </p>
                        )}
                        <div className="mt-auto rounded-lg bg-brand-yellow-soft px-3 py-2 text-xs">
                          <div className="flex justify-between font-semibold text-brand-blue">
                            <span>{nights} night total</span>
                            <span>{formatPHP(room.subtotal)}</span>
                          </div>
                          <div className="mt-0.5 flex justify-between text-muted">
                            <span>50% downpayment</span>
                            <span>{formatPHP(room.deposit)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </FormSection>

          {selectedRoom && (
            <FormSection
              title="Your contact details"
              description="We'll use this to confirm your reservation."
            >
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
                  hint="Early check-in, dietary needs, celebrations, etc."
                  name="specialRequests"
                  rows={3}
                  placeholder="Tell us anything that would make your stay better..."
                  value={contact.specialRequests}
                  onChange={(event) =>
                    setContact((c) => ({
                      ...c,
                      specialRequests: event.target.value,
                    }))
                  }
                />
              </div>
            </FormSection>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary px-5 py-3"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedRoom || !contactComplete}
              onClick={() => setStep(3)}
              className="btn-primary flex-1 py-3 text-base"
            >
              Continue to payment
            </button>
          </div>
          {selectedRoom && !contactComplete && (
            <p className="input-hint text-center">
              Fill in your name, email, and phone to continue.
            </p>
          )}
        </div>
      )}

      {step === 3 && selectedRoom && totals && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="space-y-6">
            <FormSection
              title="Pay your downpayment"
              description="Scan the QR code to pay the 50% downpayment, then upload your receipt below."
            >
              <div className="space-y-5">
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
                    <p className="text-muted">Downpayment due now (50%)</p>
                    {paymentSettings.accountName && (
                      <p className="text-foreground">
                        <span className="font-semibold">Account:</span>{" "}
                        {paymentSettings.accountName}
                      </p>
                    )}
                    {paymentSettings.accountNumber && (
                      <p className="text-foreground">
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

                {submitError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-secondary px-5 py-3"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !paymentProofUrl}
                    onClick={handleSubmit}
                    className="btn-primary flex-1 py-3 text-base"
                  >
                    {submitting ? "Submitting..." : "Submit booking"}
                  </button>
                </div>
              </div>
            </FormSection>
          </div>

          <aside className="sticky-summary">
            <div className="surface-card rounded-2xl border-brand-yellow bg-brand-yellow-soft p-5">
              <h3 className="text-lg font-bold text-brand-blue">
                Booking summary
              </h3>
              <div className="mt-3 overflow-hidden rounded-xl bg-white/70">
                <div className="relative h-28 w-full">
                  <Image
                    src={getRoomImage(selectedRoom.slug, selectedRoom.imageUrl)}
                    alt={selectedRoom.name}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
                <div className="px-4 py-3 text-sm">
                  <p className="font-semibold text-brand-blue">
                    {selectedRoom.name}
                  </p>
                  <p className="mt-1 text-muted">
                    {guests} guest{guests === 1 ? "" : "s"} · {nights} night
                    {nights === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm text-foreground">
                <div className="flex justify-between">
                  <dt className="text-muted">Room</dt>
                  <dd>{formatPHP(totals.subtotal)}</dd>
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
                  <dt>Total</dt>
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
      )}
    </div>
  );
}
