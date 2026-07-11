#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Pushing Supabase migrations (schema + seed)..."
supabase db push --yes

if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "→ Uploading images to Supabase Storage..."
  npx tsx scripts/upload-images-to-supabase.ts
else
  echo "→ Skipping image upload (set Supabase keys in .env, or run CLI):"
  echo "  supabase --experimental storage cp --linked -r public/images/rooms ss:///uploads/rooms"
  echo "  supabase --experimental storage cp --linked -r public/images/facilities ss:///uploads/facilities"
fi

if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" != *"[YOUR-PASSWORD]"* ]]; then
  echo "→ Prisma seed (optional refresh)..."
  npx prisma db seed
else
  echo "→ Skipping Prisma seed — fill DATABASE_URL in .env to run the app locally."
fi

echo "Done. Restart with: npm run dev"
