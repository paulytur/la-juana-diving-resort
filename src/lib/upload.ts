import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  getPublicStorageUrl,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "./supabase";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
]);

const EXTENSION_TYPES = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export type UploadFolder = "rooms" | "facilities" | "payments" | "settings";

function resolveImageType(file: File) {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = path.extname(file.name).toLowerCase();
  return EXTENSION_TYPES.get(extension) ?? null;
}

function buildFilename(file: File, extension: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
}

async function saveUploadedImageLocal(file: File, folder: UploadFolder) {
  const contentType = resolveImageType(file);
  if (!contentType) {
    throw new Error("Only JPG, PNG, WebP, and HEIC images are allowed.");
  }
  const extension = ALLOWED_TYPES.get(contentType)!;
  const filename = buildFilename(file, extension);
  const uploadDir = path.join(process.cwd(), "public", "images", folder);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/images/${folder}/${filename}`;
}

async function saveUploadedImageSupabase(file: File, folder: UploadFolder) {
  const contentType = resolveImageType(file);
  if (!contentType) {
    throw new Error("Only JPG, PNG, WebP, and HEIC images are allowed.");
  }
  const extension = ALLOWED_TYPES.get(contentType)!;
  const filename = buildFilename(file, extension);
  const storagePath = `${folder}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from("uploads")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return getPublicStorageUrl(storagePath);
}

export async function saveUploadedImage(file: File, folder: UploadFolder) {
  const contentType = resolveImageType(file);
  if (!contentType) {
    throw new Error("Only JPG, PNG, WebP, and HEIC images are allowed.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  if (isSupabaseConfigured()) {
    return saveUploadedImageSupabase(file, folder);
  }

  return saveUploadedImageLocal(file, folder);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
