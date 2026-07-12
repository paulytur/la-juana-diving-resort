import { format } from "date-fns";
import type { RoomType } from "@/generated/prisma/client";
import { FEES } from "@/lib/constants";
import { calculateDeposit } from "@/lib/pricing";

export type RoomSelection = {
  roomTypeId: string;
  quantity: number;
};

export type RoomWithUnits = Pick<
  RoomType,
  | "id"
  | "slug"
  | "name"
  | "capacityMin"
  | "capacityMax"
  | "pricePerNight"
  | "pricePerPerson"
> & {
  availableUnits: number;
};

type GuestSlot = {
  roomTypeId: string;
  maxGuests: number;
  guests: number;
};

export function getMaxSingleRoomCapacity(rooms: Pick<RoomType, "capacityMax">[]) {
  return rooms.reduce((max, room) => Math.max(max, room.capacityMax), 1);
}

export function getMaxBookableGuests(
  rooms: Pick<RoomType, "capacityMax" | "inventory" | "pricePerPerson">[],
) {
  return rooms.reduce((sum, room) => {
    if (room.pricePerPerson) {
      return sum + Math.max(room.inventory, 1);
    }
    return sum + room.capacityMax * Math.max(room.inventory, 1);
  }, 0);
}

export function needsMultipleRooms(
  guests: number,
  rooms: Pick<RoomType, "capacityMax">[],
) {
  return guests > getMaxSingleRoomCapacity(rooms);
}

export function selectionCapacity(
  selections: RoomSelection[],
  roomById: Map<string, RoomWithUnits>,
) {
  let capacity = 0;
  for (const { roomTypeId, quantity } of selections) {
    const room = roomById.get(roomTypeId);
    if (!room || quantity < 1) continue;
    capacity += room.pricePerPerson
      ? quantity
      : room.capacityMax * quantity;
  }
  return capacity;
}

export function distributeGuestsAcrossUnits(
  selections: RoomSelection[],
  roomById: Map<string, RoomWithUnits>,
  totalGuests: number,
) {
  const slots: GuestSlot[] = [];

  for (const { roomTypeId, quantity } of selections) {
    const room = roomById.get(roomTypeId);
    if (!room || quantity < 1) continue;

    if (room.pricePerPerson) {
      slots.push({ roomTypeId, maxGuests: quantity, guests: 0 });
      continue;
    }

    for (let index = 0; index < quantity; index += 1) {
      slots.push({ roomTypeId, maxGuests: room.capacityMax, guests: 0 });
    }
  }

  if (slots.length === 0) {
    throw new Error("Select at least one room");
  }

  let remaining = totalGuests;
  for (const slot of slots) {
    if (remaining <= 0) break;
    const assigned = Math.min(remaining, slot.maxGuests);
    slot.guests = assigned;
    remaining -= assigned;
  }

  if (remaining > 0) {
    throw new Error("Selected rooms do not fit your guest count");
  }

  return slots
    .filter((slot) => slot.guests > 0)
    .map((slot) => ({ roomTypeId: slot.roomTypeId, guests: slot.guests }));
}

export function calculateSelectionTotals({
  selections,
  roomById,
  totalGuests,
  nights,
  pets,
  dayTourGuests,
}: {
  selections: RoomSelection[];
  roomById: Map<string, RoomWithUnits>;
  totalGuests: number;
  nights: number;
  pets: number;
  dayTourGuests: number;
}) {
  const units = distributeGuestsAcrossUnits(selections, roomById, totalGuests);
  let subtotal = 0;

  for (const unit of units) {
    const room = roomById.get(unit.roomTypeId)!;
    subtotal += room.pricePerPerson
      ? room.pricePerNight * unit.guests * nights
      : room.pricePerNight * nights;
  }

  const petFee = pets * FEES.pet;
  const dayTourFee = dayTourGuests * FEES.dayTour;
  const totalAmount = subtotal + petFee + dayTourFee;
  const depositAmount = calculateDeposit(totalAmount);

  return {
    units,
    subtotal,
    petFee,
    dayTourFee,
    totalAmount,
    depositAmount,
    balanceDue: totalAmount - depositAmount,
  };
}

export function generateGroupReference() {
  const datePart = format(new Date(), "yyMMdd");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LJ-GRP-${datePart}-${randomPart}`;
}

export function unitSubtotal(
  room: Pick<RoomType, "pricePerNight" | "pricePerPerson">,
  nights: number,
  guestsForUnit: number,
) {
  return room.pricePerPerson
    ? room.pricePerNight * guestsForUnit * nights
    : room.pricePerNight * nights;
}

export function previewRoomDeposit(
  room: Pick<RoomType, "pricePerNight" | "pricePerPerson">,
  nights: number,
  guestsForUnit: number,
) {
  const subtotal = unitSubtotal(room, nights, guestsForUnit);
  return calculateDeposit(subtotal);
}
