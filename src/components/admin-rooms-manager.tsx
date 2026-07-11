"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomType } from "@/generated/prisma/client";
import {
  AdminDetailHeader,
  AdminEditorShell,
  AdminListItem,
  AdminStatusPill,
} from "@/components/admin-editor-shell";
import { AdminEmptyState, AdminFeedback } from "@/components/admin-feedback";
import { AdminImageUpload } from "@/components/admin-image-upload";
import { getRoomImage } from "@/lib/images";
import { formatPHP } from "@/lib/pricing";

type RoomWithCount = RoomType & {
  _count: { bookings: number };
};

type AdminRoomsManagerProps = {
  rooms: RoomWithCount[];
};

type RoomDraft = {
  name: string;
  description: string;
  beds: string;
  capacityMin: number;
  capacityMax: number;
  pricePerNight: number;
  pricePerPerson: boolean;
  inventory: number;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyDraft = (): RoomDraft => ({
  name: "",
  description: "",
  beds: "",
  capacityMin: 1,
  capacityMax: 2,
  pricePerNight: 0,
  pricePerPerson: false,
  inventory: 1,
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
});

function toDraft(room: RoomWithCount): RoomDraft {
  return {
    name: room.name,
    description: room.description ?? "",
    beds: room.beds,
    capacityMin: room.capacityMin,
    capacityMax: room.capacityMax,
    pricePerNight: room.pricePerNight,
    pricePerPerson: room.pricePerPerson,
    inventory: room.inventory,
    imageUrl: room.imageUrl ?? getRoomImage(room.slug),
    sortOrder: room.sortOrder,
    isActive: room.isActive,
  };
}

export function AdminRoomsManager({ rooms: initialRooms }: AdminRoomsManagerProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RoomDraft>>(() =>
    Object.fromEntries(initialRooms.map((room) => [room.id, toDraft(room)])),
  );
  const [newRoom, setNewRoom] = useState<RoomDraft>(emptyDraft);
  const [busyId, setBusyId] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rooms.length === 0) return;
    const prefersDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersDesktop && !selectedId) {
      setSelectedId(rooms[0].id);
    }
  }, [rooms, selectedId]);

  const isCreating = selectedId === "new";
  const selectedRoom = rooms.find((room) => room.id === selectedId);
  const editDraft = isCreating
    ? newRoom
    : selectedRoom
      ? drafts[selectedRoom.id]
      : null;

  function updateDraft(roomId: string, patch: Partial<RoomDraft>) {
    setDrafts((current) => ({
      ...current,
      [roomId]: { ...current[roomId], ...patch },
    }));
  }

  async function saveRoom(roomId: string) {
    setBusyId(roomId);
    setMessage(null);
    setError(null);

    try {
      const draft = drafts[roomId];
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          description: draft.description || null,
          imageUrl: draft.imageUrl || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      setRooms((current) =>
        current.map((room) =>
          room.id === roomId ? { ...data, _count: room._count } : room,
        ),
      );
      setDrafts((current) => ({ ...current, [roomId]: toDraft({ ...data, _count: { bookings: selectedRoom?._count.bookings ?? 0 } }) }));
      setMessage("Room updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createRoom() {
    setBusyId("new");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRoom,
          description: newRoom.description || undefined,
          imageUrl: newRoom.imageUrl || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Create failed");
      }

      const created: RoomWithCount = { ...data, _count: { bookings: 0 } };
      setRooms((current) => [...current, created]);
      setDrafts((current) => ({ ...current, [created.id]: toDraft(created) }));
      setNewRoom(emptyDraft());
      setSelectedId(created.id);
      setMessage("Room added successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRoom(roomId: string) {
    if (!confirm("Remove this room from the site?")) return;

    setBusyId(roomId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Delete failed");
      }

      const remaining = rooms.filter((room) => room.id !== roomId);
      setRooms(remaining);
      setDrafts((current) => {
        const next = { ...current };
        delete next[roomId];
        return next;
      });
      setSelectedId(remaining[0]?.id ?? null);
      setMessage("Room removed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (rooms.length === 0 && !isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedId("new")}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Add first room
          </button>
        </div>
        {selectedId === "new" ? (
          <RoomEditor
            title="New room"
            draft={newRoom}
            onChange={(patch) => setNewRoom((current) => ({ ...current, ...patch }))}
            onBack={() => setSelectedId(null)}
            onSave={createRoom}
            saving={busyId === "new"}
            saveLabel="Add room"
          />
        ) : (
          <AdminEmptyState
            title="No rooms yet"
            description="Add your first room type to start accepting bookings."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && <AdminFeedback message={message} tone="success" />}
      {error && <AdminFeedback message={error} tone="error" />}

      <AdminEditorShell
        showDetail={selectedId !== null}
        list={
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {rooms.length} room types
              </p>
              <button
                type="button"
                onClick={() => setSelectedId("new")}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                + Add
              </button>
            </div>
            {rooms.map((room) => {
              const roomDraft = drafts[room.id];
              const preview =
                roomDraft.imageUrl || getRoomImage(room.slug, room.imageUrl);

              return (
                <AdminListItem
                  key={room.id}
                  active={selectedId === room.id}
                  onClick={() => setSelectedId(room.id)}
                  image={preview}
                  title={roomDraft.name}
                  subtitle={`${formatPHP(roomDraft.pricePerNight)} · ${roomDraft.inventory} units`}
                  badge={
                    <AdminStatusPill
                      active={roomDraft.isActive}
                      activeLabel="Open"
                      inactiveLabel="Hidden"
                    />
                  }
                />
              );
            })}
          </div>
        }
        detail={
          isCreating && editDraft ? (
            <RoomEditor
              title="New room"
              draft={editDraft}
              onChange={(patch) => setNewRoom((current) => ({ ...current, ...patch }))}
              onBack={() => setSelectedId(rooms[0]?.id ?? null)}
              onSave={createRoom}
              saving={busyId === "new"}
              saveLabel="Add room"
            />
          ) : selectedRoom && editDraft ? (
            <RoomEditor
              title={editDraft.name}
              draft={editDraft}
              activeBookings={selectedRoom._count.bookings}
              onChange={(patch) => updateDraft(selectedRoom.id, patch)}
              onBack={() => setSelectedId(null)}
              onSave={() => saveRoom(selectedRoom.id)}
              onDelete={
                selectedRoom._count.bookings === 0
                  ? () => deleteRoom(selectedRoom.id)
                  : undefined
              }
              saving={busyId === selectedRoom.id}
              saveLabel="Save changes"
            />
          ) : null
        }
        emptyDetail={
          <div className="surface-card hidden rounded-2xl px-6 py-16 text-center lg:block">
            <p className="font-semibold text-brand-blue">Select a room</p>
            <p className="input-hint mt-2">
              Pick one from the list or add a new room type.
            </p>
          </div>
        }
      />
    </div>
  );
}

type RoomEditorProps = {
  title: string;
  draft: RoomDraft;
  activeBookings?: number;
  onChange: (patch: Partial<RoomDraft>) => void;
  onBack: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
  saveLabel: string;
};

function RoomEditor({
  title,
  draft,
  activeBookings,
  onChange,
  onBack,
  onSave,
  onDelete,
  saving,
  saveLabel,
}: RoomEditorProps) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <AdminDetailHeader
        title={title}
        onBack={onBack}
        action={
          <label className="inline-flex items-center gap-2 rounded-full border border-line bg-brand-yellow-soft px-3 py-1.5 text-xs font-semibold text-brand-blue">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => onChange({ isActive: event.target.checked })}
              className="accent-brand-blue"
            />
            Open for booking
          </label>
        }
      />

      {activeBookings !== undefined && activeBookings > 0 && (
        <p className="mb-4 rounded-xl border border-brand-yellow bg-brand-yellow-soft px-4 py-2 text-sm text-brand-blue">
          {activeBookings} active booking{activeBookings === 1 ? "" : "s"} — hide
          the room instead of deleting if guests are booked.
        </p>
      )}

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-blue">Room photo</p>
          <AdminImageUpload
            compact
            folder="rooms"
            value={draft.imageUrl}
            alt={draft.name || "Room"}
            onChange={(imageUrl) => onChange({ imageUrl })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-brand-blue">Room name</span>
            <input
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              className="input-field"
              placeholder="Sunset Suite"
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-brand-blue">Description</span>
            <textarea
              rows={2}
              value={draft.description}
              onChange={(event) => onChange({ description: event.target.value })}
              className="input-field resize-none"
              placeholder="Short description for guests..."
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-brand-blue">Beds</span>
            <input
              value={draft.beds}
              onChange={(event) => onChange({ beds: event.target.value })}
              className="input-field"
              placeholder="1 Queen Bed, 1 Single Bed"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-blue">Min guests</span>
            <input
              type="number"
              min={1}
              max={20}
              value={draft.capacityMin}
              onChange={(event) =>
                onChange({ capacityMin: Number(event.target.value) })
              }
              className="input-field"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-blue">Max guests</span>
            <input
              type="number"
              min={1}
              max={20}
              value={draft.capacityMax}
              onChange={(event) =>
                onChange({ capacityMax: Number(event.target.value) })
              }
              className="input-field"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-blue">Price (₱)</span>
            <input
              type="number"
              min={0}
              value={draft.pricePerNight}
              onChange={(event) =>
                onChange({ pricePerNight: Number(event.target.value) })
              }
              className="input-field"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-blue">Inventory</span>
            <span className="input-hint block">
              {draft.pricePerPerson ? "Beds available" : "Units available"}
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.inventory}
              onChange={(event) =>
                onChange({ inventory: Number(event.target.value) })
              }
              className="input-field"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-brand-blue">Display order</span>
            <input
              type="number"
              min={0}
              max={999}
              value={draft.sortOrder}
              onChange={(event) =>
                onChange({ sortOrder: Number(event.target.value) })
              }
              className="input-field"
            />
          </label>

          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-brand-blue">
            <input
              type="checkbox"
              checked={draft.pricePerPerson}
              onChange={(event) => onChange({ pricePerPerson: event.target.checked })}
              className="accent-brand-blue"
            />
            Price is per person / night
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="btn-primary px-6 py-3 disabled:opacity-60"
          >
            {saving ? "Saving..." : saveLabel}
          </button>
          {onDelete && (
            <button
              type="button"
              disabled={saving}
              onClick={onDelete}
              className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Remove room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
