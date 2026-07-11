import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { BookingForInvoice } from "@/lib/generate-invoice-pdf";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";
import {
  getPublicStorageUrl,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase";

function invoiceFilename(reference: string) {
  return `${reference.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
}

async function storeInvoiceLocal(reference: string, pdfBytes: Uint8Array) {
  const filename = invoiceFilename(reference);
  const uploadDir = path.join(process.cwd(), "public", "invoices");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), pdfBytes);
  return `/invoices/${filename}`;
}

async function storeInvoiceSupabase(reference: string, pdfBytes: Uint8Array) {
  const storagePath = `invoices/${invoiceFilename(reference)}`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from("uploads")
    .upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return getPublicStorageUrl(storagePath);
}

export async function createBookingInvoice(
  booking: BookingForInvoice,
): Promise<string> {
  const pdfBytes = await generateInvoicePdf(booking);

  if (isSupabaseConfigured()) {
    return storeInvoiceSupabase(booking.reference, pdfBytes);
  }

  return storeInvoiceLocal(booking.reference, pdfBytes);
}

export async function ensureBookingInvoice(
  booking: BookingForInvoice,
): Promise<string> {
  if (booking.invoiceUrl) {
    return booking.invoiceUrl;
  }
  return createBookingInvoice(booking);
}
