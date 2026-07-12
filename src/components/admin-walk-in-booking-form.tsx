"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomType } from "@/generated/prisma/client";
import { AdminFeedback } from "@/components/admin-feedback";
import {
  DateField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form-fields";
import { FormField } from "@/components/form-field";
import { FormSection } from "@/components/form-section";
import { CapacityProgress, QuantityStepper } from "@/components/quantity-stepper";
import { cn } from "@/lib/cn";
import { FEES } from "@/lib/constants";
import {
  calculateSelectionTotals,
  getMaxBookableGuests,
  selectionCapacity,
} from "@/lib/multi-room";
import { formatPHP } from "@/lib/pricing";

type AvailableRoom = {
  id: string;
  slug: string;
  name: string;
  beds: string;
  capacityMin: number;
  capacityMax: number;
  pricePerNight: number;
  pricePerPerson: boolean;
  availableUnits: number;
  subtotal: number;
  deposit: number;
};

type AdminWalkInBookingFormProps = {
  rooms: RoomType[];
};

export function AdminWalkInBookingForm({ rooms }: AdminWalkInBookingFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const maxGuests = Math.min(20, getMaxBookableGuests(rooms));

  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [nights, setNights] = useState(0);
  const [multiRoom, setMultiRoom] = useState(false);
  const [roomQuantities, setRoomQuantities] = useState<Record<string, number>>({});
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [pets, setPets] = useState(0);
  const [dayTourGuests, setDayTourGuests] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmImmediately, setConfirmImmediately] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);
  const checkOutMin = checkIn || today;

  const roomById = useMemo(
    () =>
      new Map(
        availableRooms.map((room) => [
          room.id,
          {
            id: room.id,
            slug: room.slug,
            name: room.name,
            capacityMin: room.capacityMin,
            capacityMax: room.capacityMax,
            pricePerNight: room.pricePerNight,
            pricePerPerson: room.pricePerPerson,
            availableUnits: room.availableUnits,
          },
        ]),
      ),
    [availableRooms],
  );

  const roomSelections = useMemo(
    () =>
      Object.entries(roomQuantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([roomTypeId, quantity]) => ({ roomTypeId, quantity })),
    [roomQuantities],
  );

  const selectedCapacity = useMemo(
    () => selectionCapacity(roomSelections, roomById),
    [roomSelections, roomById],
  );

  const selectedRoom = availableRooms.find((room) => room.id === selectedRoomId);

  const roomSelectionComplete = multiRoom
    ? roomSelections.length > 0 && selectedCapacity >= guests
    : Boolean(selectedRoom);

  const totals = useMemo(() => {
    if (!roomSelectionComplete) return null;

    if (multiRoom) {
      try {
        return calculateSelectionTotals({
          selections: roomSelections,
          roomById,
          totalGuests: guests,
          nights,
          pets,
          dayTourGuests,
        });
      } catch {
        return null;
      }
    }

    if (!selectedRoom) return null;
    const petFee = pets * FEES.pet;
    const dayTourFee = dayTourGuests * FEES.dayTour;
    const total = selectedRoom.subtotal + petFee + dayTourFee;
    return {
      subtotal: selectedRoom.subtotal,
      petFee,
      dayTourFee,
      totalAmount: total,
      depositAmount: selectedRoom.deposit,
    };
  }, [
    roomSelectionComplete,
    multiRoom,
    roomSelections,
    roomById,
    guests,
    nights,
    pets,
    dayTourGuests,
    selectedRoom,
  ]);

  const searchAvailability = useCallback(async () => {
    if (!hasDates) return;
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
      setMultiRoom(Boolean(data.multiRoom));
      setRoomQuantities({});
      setSelectedRoomId("");
      setSearched(true);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Could not load availability",
      );
    } finally {
      setSearching(false);
    }
  }, [checkIn, checkOut, guests, hasDates]);

  function updateRoomQuantity(roomId: string, nextQuantity: number, maxUnits: number) {
    const quantity = Math.max(0, Math.min(nextQuantity, maxUnits));
    setRoomQuantities((current) => {
      const updated = { ...current };
      if (quantity === 0) {
        delete updated[roomId];
      } else {
        updated[roomId] = quantity;
      }
      return updated;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!roomSelectionComplete || !totals) return;

    setSubmitting(true);
    setSubmitError(null);

    const notes = [
      adminNotes.trim(),
      paymentMethod !== "none" ? `Payment: ${paymentMethod}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const payload = {
        checkIn,
        checkOut,
        guests,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim() || undefined,
        pets,
        dayTourGuests,
        adminNotes: notes || undefined,
        confirmImmediately,
        ...(multiRoom
          ? { rooms: roomSelections }
          : { roomTypeId: selectedRoom!.id }),
      };

      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create booking");
      }

      router.push(`/admin/bookings?created=${data.reference}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create booking",
      );
      setSubmitting(false);
    }
  }

  const contactComplete =
    guestName.trim().length >= 2 && guestPhone.trim().length >= 7;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Stay dates"
        description="Pick check-in, check-out, and guest count, then check availability."
      >
        <div className="space-y-4">
          <div className="date-range-group">
            <p className="date-range-group__label">Dates</p>
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
                setSearched(false);
              }}
            />
            <DateField
              label="Check-out"
              name="checkOut"
              required
              value={checkOut}
              min={checkOutMin}
              disabled={!checkIn}
              onChange={(event) => {
                setCheckOut(event.target.value);
                setSearched(false);
              }}
            />
          </div>

          <FormField label="Guests" hint="Include everyone staying overnight.">
            <QuantityStepper
              value={guests}
              min={1}
              max={maxGuests}
              onChange={(value) => {
                setGuests(value);
                setSearched(false);
              }}
              unitLabel="guest"
              compact
            />
          </FormField>

          {searchError && <AdminFeedback message={searchError} tone="error" />}

          <button
            type="button"
            disabled={!hasDates || searching}
            onClick={searchAvailability}
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            {searching ? "Checking..." : "Check availability"}
          </button>
        </div>
      </FormSection>

      {searched && (
        <FormSection
          title={multiRoom ? "Select rooms" : "Select a room"}
          description={
            availableRooms.length === 0
              ? "No rooms available for these dates."
              : `${availableRooms.length} option${availableRooms.length === 1 ? "" : "s"} · ${nights} night${nights === 1 ? "" : "s"}`
          }
        >
          {multiRoom && availableRooms.length > 0 && (
            <CapacityProgress selected={selectedCapacity} required={guests} />
          )}

          {availableRooms.length === 0 ? (
            <p className="text-sm text-muted">Try different dates or fewer guests.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableRooms.map((room) => {
                const selected = multiRoom
                  ? (roomQuantities[room.id] ?? 0) > 0
                  : room.id === selectedRoomId;
                const quantity = roomQuantities[room.id] ?? 0;

                return (
                  <div
                    key={room.id}
                    className={cn(
                      "rounded-xl border p-4 transition",
                      selected
                        ? "border-brand-blue bg-brand-blue-light/30"
                        : "border-line bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-brand-blue">{room.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Fits {room.capacityMin}–{room.capacityMax} · {room.beds}
                        </p>
                        <p className="text-xs text-muted">
                          {room.availableUnits} available · {formatPHP(room.subtotal)} total
                        </p>
                      </div>
                    </div>

                    {multiRoom ? (
                      <div className="mt-3">
                        <QuantityStepper
                          value={quantity}
                          min={0}
                          max={room.availableUnits}
                          onChange={(next) =>
                            updateRoomQuantity(room.id, next, room.availableUnits)
                          }
                          unitLabel={room.pricePerPerson ? "bed" : "room"}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={cn(
                          "mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition",
                          selected
                            ? "bg-brand-blue text-white"
                            : "bg-brand-yellow-soft text-brand-blue hover:bg-brand-yellow",
                        )}
                      >
                        {selected ? "Selected" : "Select"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </FormSection>
      )}

      {roomSelectionComplete && (
        <>
          <FormSection title="Guest details" description="Who is checking in?">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                className="sm:col-span-2"
                label="Full name"
                name="guestName"
                required
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
              />
              <TextField
                label="Phone"
                name="guestPhone"
                type="tel"
                required
                placeholder="+63 9XX XXX XXXX"
                value={guestPhone}
                onChange={(event) => setGuestPhone(event.target.value)}
              />
              <TextField
                label="Email"
                name="guestEmail"
                type="email"
                placeholder="Optional — for invoice"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
              />
              <SelectField
                label="Pets"
                name="pets"
                value={pets}
                onChange={(event) => setPets(Number(event.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "None" : count}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Day tour guests"
                name="dayTourGuests"
                value={dayTourGuests}
                onChange={(event) => setDayTourGuests(Number(event.target.value))}
              >
                {Array.from({ length: 11 }, (_, index) => index).map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "None" : count}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                className="sm:col-span-2"
                label="Special requests"
                name="specialRequests"
                rows={2}
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
              />
            </div>
          </FormSection>

          <FormSection title="Payment & notes">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Payment method"
                name="paymentMethod"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="bank transfer">Bank transfer</option>
                <option value="gcash">GCash</option>
                <option value="none">Pay later</option>
              </SelectField>
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Staff notes"
                  name="adminNotes"
                  hint="Internal note — e.g. walk-in, paid at front desk."
                  rows={2}
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={confirmImmediately}
                  onChange={(event) => setConfirmImmediately(event.target.checked)}
                  className="h-4 w-4 rounded border-line text-brand-blue"
                />
                <span className="text-sm text-foreground">
                  Confirm immediately{" "}
                  <span className="text-muted">(skip pending — recommended for walk-ins)</span>
                </span>
              </label>
            </div>
          </FormSection>

          {totals && (
            <div className="rounded-2xl border border-line bg-brand-yellow-soft/50 p-5">
              <p className="text-sm font-semibold text-brand-blue">Booking summary</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Room total</dt>
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
                <div className="flex justify-between border-t border-line pt-2 font-bold text-brand-blue">
                  <dt>Total</dt>
                  <dd>{formatPHP(totals.totalAmount)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>50% deposit</dt>
                  <dd>{formatPHP(totals.depositAmount)}</dd>
                </div>
              </dl>
            </div>
          )}

          {submitError && <AdminFeedback message={submitError} tone="error" />}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/bookings")}
              className="btn-secondary px-5 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!contactComplete || submitting}
              className="btn-primary flex-1 py-3"
            >
              {submitting
                ? "Creating..."
                : confirmImmediately
                  ? "Create & confirm booking"
                  : "Create booking"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
