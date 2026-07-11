/**
 * Upload public/images/* to Supabase Storage bucket "uploads".
 *
 * Requires in .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Or use the Supabase CLI (linked project):
 *   supabase --experimental storage cp --linked -r public/images/rooms ss:///uploads/rooms
 *   supabase --experimental storage cp --linked -r public/images/facilities ss:///uploads/facilities
 */
import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import path from "path";
import {
  getPublicStorageUrl,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "../src/lib/supabase";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function uploadFolder(localFolder: "rooms" | "facilities") {
  const dir = path.join(process.cwd(), "public", "images", localFolder);
  const files = await readdir(dir);
  const supabase = getSupabaseAdmin();

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    if (!MIME[ext]) continue;

    const storagePath = `${localFolder}/${filename}`;
    const buffer = await readFile(path.join(dir, filename));

    const { error } = await supabase.storage
      .from("uploads")
      .upload(storagePath, buffer, {
        contentType: MIME[ext],
        upsert: true,
      });

    if (error) {
      throw new Error(`${storagePath}: ${error.message}`);
    }

    console.log("Uploaded", getPublicStorageUrl(storagePath));
  }
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
    process.exit(1);
  }

  await uploadFolder("rooms");
  await uploadFolder("facilities");
  console.log("Done — images are in the uploads bucket.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
