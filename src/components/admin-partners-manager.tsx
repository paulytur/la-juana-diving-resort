"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Partner } from "@/generated/prisma/client";
import { AdminEmptyState, AdminFeedback } from "@/components/admin-feedback";
import { getSiteUrl } from "@/lib/partner-client";
import { cn } from "@/lib/cn";

type AdminPartnersManagerProps = {
  partners: Partner[];
};

export function AdminPartnersManager({ partners }: AdminPartnersManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  async function createPartner(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;

    setCreating(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Create failed");
      setName("");
      setFeedback({
        message: `Partner "${data.name}" created. Copy the API key and share it securely.`,
        tone: "success",
      });
      setVisibleKeyId(data.id);
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Create failed",
        tone: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function updatePartner(
    id: string,
    payload: { isActive?: boolean; regenerateKey?: boolean },
    successMessage: string,
  ) {
    setBusyId(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      setFeedback({ message: successMessage, tone: "success" });
      if (payload.regenerateKey) setVisibleKeyId(id);
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Update failed",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function deletePartner(id: string, partnerName: string) {
    if (!confirm(`Remove partner "${partnerName}"? Their API key stops working immediately.`))
      return;

    setBusyId(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Delete failed");
      setFeedback({ message: "Partner removed.", tone: "success" });
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Delete failed",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function copyKey(partner: Partner) {
    try {
      await navigator.clipboard.writeText(partner.apiKey);
      setCopiedId(partner.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setFeedback({ message: "Could not copy — select the key manually.", tone: "error" });
    }
  }

  function maskKey(key: string) {
    return `${key.slice(0, 12)}…${key.slice(-4)}`;
  }

  return (
    <div className="space-y-6">
      {feedback && <AdminFeedback message={feedback.message} tone={feedback.tone} />}

      <form
        onSubmit={createPartner}
        className="surface-card flex flex-wrap items-end gap-3 rounded-2xl p-5"
      >
        <div className="min-w-56 flex-1">
          <label
            htmlFor="partner-name"
            className="block text-sm font-semibold text-brand-blue"
          >
            Partner website name
          </label>
          <input
            id="partner-name"
            className="input-field mt-2"
            placeholder="e.g. Mabini Dive Shop"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={creating || name.trim().length < 2}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create partner + API key"}
        </button>
      </form>

      {partners.length === 0 ? (
        <AdminEmptyState
          title="No partners yet"
          description="Create a partner to generate their API key and tracked booking links."
        />
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => {
            const keyVisible = visibleKeyId === partner.id;
            const bookingLink = `${getSiteUrl()}/book?partner=${partner.slug}`;

            return (
              <article key={partner.id} className="surface-card rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-brand-blue">{partner.name}</p>
                    <p className="text-sm text-muted">
                      Slug: <span className="font-mono">{partner.slug}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      partner.isActive
                        ? "bg-brand-blue-light text-brand-blue"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    {partner.isActive ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      API key
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <code className="rounded-lg border border-line bg-brand-yellow-soft/50 px-3 py-1.5 font-mono text-xs">
                        {keyVisible ? partner.apiKey : maskKey(partner.apiKey)}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleKeyId(keyVisible ? null : partner.id)
                        }
                        className="text-xs font-semibold text-brand-blue hover:underline"
                      >
                        {keyVisible ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyKey(partner)}
                        className="text-xs font-semibold text-brand-blue hover:underline"
                      >
                        {copiedId === partner.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Tracked booking link
                    </p>
                    <code className="mt-1 block w-fit max-w-full overflow-x-auto rounded-lg border border-line bg-white px-3 py-1.5 font-mono text-xs">
                      {bookingLink}
                    </code>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === partner.id}
                    onClick={() =>
                      updatePartner(
                        partner.id,
                        { isActive: !partner.isActive },
                        partner.isActive
                          ? "Partner disabled — their key no longer works."
                          : "Partner re-enabled.",
                      )
                    }
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {partner.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === partner.id}
                    onClick={() =>
                      updatePartner(
                        partner.id,
                        { regenerateKey: true },
                        "New API key generated. The old key stopped working.",
                      )
                    }
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
                  >
                    Regenerate key
                  </button>
                  <button
                    type="button"
                    disabled={busyId === partner.id}
                    onClick={() => deletePartner(partner.id, partner.name)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
