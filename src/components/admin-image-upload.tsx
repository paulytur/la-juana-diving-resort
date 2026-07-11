"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

type AdminImageUploadProps = {
  folder: "rooms" | "facilities";
  value: string;
  onChange: (url: string) => void;
  alt: string;
  compact?: boolean;
};

export function AdminImageUpload({
  folder,
  value,
  onChange,
  alt,
  compact = false,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      onChange(data.imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-line bg-brand-yellow-soft">
            {value ? (
              <Image src={value} alt={alt} fill className="object-cover" sizes="160px" />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
                No image
              </div>
            )}
          </div>
          <div className="flex min-w-[10rem] flex-1 flex-col gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="btn-secondary w-fit px-4 py-2 text-sm"
            >
              {uploading ? "Uploading..." : "Upload photo"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
            <input
              type="url"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Image URL"
              className="input-field py-2 text-sm"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-brand-yellow-soft">
        {value ? (
          <Image src={value} alt={alt} fill className="object-cover" sizes="240px" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image yet
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="btn-secondary px-4 py-2 text-sm"
      >
        {uploading ? "Uploading..." : "Upload image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-brand-blue">Image URL</span>
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/images/rooms/example.jpg"
          className={cn("input-field py-2 text-sm")}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
