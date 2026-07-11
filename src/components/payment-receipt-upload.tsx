"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type PaymentReceiptUploadProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function PaymentReceiptUpload({
  value,
  onChange,
  disabled = false,
}: PaymentReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      onChange(data.imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setFileName(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-brand-blue">Upload transfer receipt</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-line bg-brand-yellow-soft sm:mx-0 sm:h-36 sm:w-36 sm:max-w-none sm:aspect-auto sm:shrink-0">
          {value ? (
            <Image
              src={value}
              alt="Transfer receipt"
              fill
              unoptimized
              className="object-contain p-1 sm:object-cover sm:p-0"
              sizes="(max-width: 640px) 100vw, 144px"
            />
          ) : (
            <div className="flex h-full min-h-32 items-center justify-center px-4 text-center text-sm text-muted">
              No receipt yet
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-secondary touch-target w-full px-4 py-3 text-sm disabled:opacity-60 sm:w-auto"
          >
            {uploading ? "Uploading..." : value ? "Replace screenshot" : "Choose screenshot"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={handleFileChange}
          />
          <p className="input-hint">
            Screenshot from your bank or GCash app. JPG, PNG, WebP, or HEIC up to 5 MB.
          </p>
          {fileName && !error && (
            <p className="break-all text-xs text-muted">Selected: {fileName}</p>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
