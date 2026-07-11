"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { PaymentSettings } from "@/lib/settings";

type AdminSettingsManagerProps = {
  initialSettings: PaymentSettings;
};

export function AdminSettingsManager({
  initialSettings,
}: AdminSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof PaymentSettings>(
    key: K,
    value: PaymentSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "settings");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");

      update("qrImageUrl", data.imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");

      setStatus("Payment settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6 rounded-2xl border border-line bg-white p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-brand-blue">Payment details</h2>
          <p className="text-sm text-muted">
            Guests pay a 50% downpayment by scanning this QR code, then upload
            their receipt.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">
            Account name
          </span>
          <input
            type="text"
            value={settings.accountName}
            onChange={(event) => update("accountName", event.target.value)}
            placeholder="e.g. La Juana Diving Resort"
            className="input-field py-2 text-sm"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">
            Account number / mobile
          </span>
          <input
            type="text"
            value={settings.accountNumber}
            onChange={(event) => update("accountNumber", event.target.value)}
            placeholder="e.g. 0917 123 4567 (GCash)"
            className="input-field py-2 text-sm"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-blue">
            Instructions for guests
          </span>
          <textarea
            value={settings.instructions}
            onChange={(event) => update("instructions", event.target.value)}
            rows={3}
            className="input-field py-2 text-sm"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {status && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {status}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          {saving ? "Saving..." : "Save payment settings"}
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-brand-blue">Payment QR code</h2>
        <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-xl border border-line bg-brand-yellow-soft">
          {settings.qrImageUrl ? (
            <Image
              src={settings.qrImageUrl}
              alt="Payment QR code"
              fill
              className="object-contain p-2"
              sizes="240px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
              Upload your GCash / Maya QR
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="btn-secondary w-full px-4 py-2 text-sm"
        >
          {uploading ? "Uploading..." : "Upload QR image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
        <p className="text-xs text-muted">
          Remember to click <strong>Save payment settings</strong> after
          uploading a new QR.
        </p>
      </div>
    </div>
  );
}
