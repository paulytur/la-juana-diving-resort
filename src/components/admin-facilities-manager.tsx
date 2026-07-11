"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Facility } from "@/generated/prisma/client";
import {
  AdminDetailHeader,
  AdminEditorShell,
  AdminListItem,
  AdminStatusPill,
} from "@/components/admin-editor-shell";
import { AdminEmptyState, AdminFeedback } from "@/components/admin-feedback";
import { AdminImageUpload } from "@/components/admin-image-upload";

type AdminFacilitiesManagerProps = {
  facilities: Facility[];
};

type FacilityDraft = {
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyDraft = (): FacilityDraft => ({
  name: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
});

function toDraft(facility: Facility): FacilityDraft {
  return {
    name: facility.name,
    description: facility.description,
    imageUrl: facility.imageUrl,
    sortOrder: facility.sortOrder,
    isActive: facility.isActive,
  };
}

export function AdminFacilitiesManager({
  facilities: initialFacilities,
}: AdminFacilitiesManagerProps) {
  const router = useRouter();
  const [facilities, setFacilities] = useState(initialFacilities);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [drafts, setDrafts] = useState<Record<string, FacilityDraft>>(() =>
    Object.fromEntries(
      initialFacilities.map((facility) => [facility.id, toDraft(facility)]),
    ),
  );
  const [newFacility, setNewFacility] = useState<FacilityDraft>(emptyDraft);
  const [busyId, setBusyId] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (facilities.length === 0) return;
    const prefersDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (prefersDesktop && !selectedId) {
      setSelectedId(facilities[0].id);
    }
  }, [facilities, selectedId]);

  const isCreating = selectedId === "new";
  const selectedFacility = facilities.find((f) => f.id === selectedId);
  const editDraft = isCreating
    ? newFacility
    : selectedFacility
      ? drafts[selectedFacility.id]
      : null;

  function updateDraft(facilityId: string, patch: Partial<FacilityDraft>) {
    setDrafts((current) => ({
      ...current,
      [facilityId]: { ...current[facilityId], ...patch },
    }));
  }

  async function saveFacility(facilityId: string) {
    setBusyId(facilityId);
    setMessage(null);

    try {
      const draft = drafts[facilityId];
      const response = await fetch(`/api/admin/facilities/${facilityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      setFacilities((current) =>
        current.map((facility) => (facility.id === facilityId ? data : facility)),
      );
      setDrafts((current) => ({ ...current, [facilityId]: toDraft(data) }));
      setMessage("Facility updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createFacility() {
    setBusyId("new");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFacility),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Create failed");
      }

      setFacilities((current) => [...current, data]);
      setDrafts((current) => ({ ...current, [data.id]: toDraft(data) }));
      setNewFacility(emptyDraft());
      setSelectedId(data.id);
      setMessage("Facility added.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteFacility(facilityId: string) {
    if (!confirm("Remove this facility from the site?")) return;

    setBusyId(facilityId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Delete failed");
      }

      const remaining = facilities.filter((facility) => facility.id !== facilityId);
      setFacilities(remaining);
      setDrafts((current) => {
        const next = { ...current };
        delete next[facilityId];
        return next;
      });
      setSelectedId(remaining[0]?.id ?? null);
      setMessage("Facility removed.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (facilities.length === 0 && !isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedId("new")}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Add first facility
          </button>
        </div>
        {selectedId === "new" ? (
          <FacilityEditor
            title="New facility"
            draft={newFacility}
            onChange={(patch) =>
              setNewFacility((current) => ({ ...current, ...patch }))
            }
            onBack={() => setSelectedId(null)}
            onSave={createFacility}
            saving={busyId === "new"}
            saveLabel="Add facility"
          />
        ) : (
          <AdminEmptyState
            title="No facilities yet"
            description="Add your first facility to show it on the public site."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && <AdminFeedback message={message} tone="success" />}

      <AdminEditorShell
        showDetail={selectedId !== null}
        list={
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {facilities.length} facilities
              </p>
              <button
                type="button"
                onClick={() => setSelectedId("new")}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                + Add
              </button>
            </div>
            {facilities.map((facility) => {
              const draft = drafts[facility.id];
              const preview = draft.imageUrl || "/images/facilities/beach-deck.jpg";

              return (
                <AdminListItem
                  key={facility.id}
                  active={selectedId === facility.id}
                  onClick={() => setSelectedId(facility.id)}
                  image={preview}
                  title={draft.name}
                  subtitle={`Order #${draft.sortOrder}`}
                  badge={
                    <AdminStatusPill
                      active={draft.isActive}
                      activeLabel="Visible"
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
            <FacilityEditor
              title="New facility"
              draft={editDraft}
              onChange={(patch) =>
              setNewFacility((current) => ({ ...current, ...patch }))
            }
              onBack={() => setSelectedId(facilities[0]?.id ?? null)}
              onSave={createFacility}
              saving={busyId === "new"}
              saveLabel="Add facility"
            />
          ) : selectedFacility && editDraft ? (
            <FacilityEditor
              title={editDraft.name}
              draft={editDraft}
              onChange={(patch) => updateDraft(selectedFacility.id, patch)}
              onBack={() => setSelectedId(null)}
              onSave={() => saveFacility(selectedFacility.id)}
              onDelete={() => deleteFacility(selectedFacility.id)}
              saving={busyId === selectedFacility.id}
              saveLabel="Save changes"
              visibleToggle={
                <label className="inline-flex items-center gap-2 rounded-full border border-line bg-brand-yellow-soft px-3 py-1.5 text-xs font-semibold text-brand-blue">
                  <input
                    type="checkbox"
                    checked={editDraft.isActive}
                    onChange={(event) =>
                      updateDraft(selectedFacility.id, {
                        isActive: event.target.checked,
                      })
                    }
                    className="accent-brand-blue"
                  />
                  Visible on site
                </label>
              }
            />
          ) : null
        }
        emptyDetail={
          <div className="surface-card hidden rounded-2xl px-6 py-16 text-center lg:block">
            <p className="font-semibold text-brand-blue">Select a facility</p>
            <p className="input-hint mt-2">
              Pick one from the list or add a new facility.
            </p>
          </div>
        }
      />
    </div>
  );
}

type FacilityEditorProps = {
  title: string;
  draft: FacilityDraft;
  onChange: (patch: Partial<FacilityDraft>) => void;
  onBack: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
  saveLabel: string;
  visibleToggle?: React.ReactNode;
};

function FacilityEditor({
  title,
  draft,
  onChange,
  onBack,
  onSave,
  onDelete,
  saving,
  saveLabel,
  visibleToggle,
}: FacilityEditorProps) {
  function setField<K extends keyof FacilityDraft>(key: K, value: FacilityDraft[K]) {
    onChange({ [key]: value });
  }

  return (
    <div className="surface-card rounded-2xl p-5">
      <AdminDetailHeader title={title} onBack={onBack} action={visibleToggle} />

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-blue">Photo</p>
          <AdminImageUpload
            compact
            folder="facilities"
            value={draft.imageUrl}
            alt={draft.name || "Facility"}
            onChange={(imageUrl) => setField("imageUrl", imageUrl)}
          />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">Name</span>
          <input
            value={draft.name}
            onChange={(event) => setField("name", event.target.value)}
            className="input-field"
            placeholder="Pool & Jacuzzi"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">Description</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => setField("description", event.target.value)}
            className="input-field resize-none"
            placeholder="Describe what guests can enjoy..."
          />
        </label>

        <label className="block max-w-xs space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">Display order</span>
          <span className="input-hint block">Lower numbers appear first.</span>
          <input
            type="number"
            min={0}
            max={999}
            value={draft.sortOrder}
            onChange={(event) => setField("sortOrder", Number(event.target.value))}
            className="input-field"
          />
        </label>

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
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
