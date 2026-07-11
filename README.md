# La Juana Diving Resort — Booking & Admin

Booking website and admin dashboard for [La Juana Diving Resort](https://www.facebook.com/LaJuanaDivingResort) in Mabini, Batangas.

## Features

- Public site with room rates from the resort pricelist
- 3-step booking: dates & guests → available rooms → QR downpayment
- Automatic price calculation (including dorm per-pax pricing)
- Availability checks to prevent double-booking
- Admin dashboard to confirm, complete, or cancel bookings
- Payment settings (QR code upload) in admin

## Room rates (PHP)

| Room | Capacity | Rate |
|------|----------|------|
| Marrakkesh | 5 pax | ₱7,000 / night |
| Hiraya | 3–4 pax | ₱6,000 / night |
| Oia | 3–4 pax | ₱6,000 / night |
| Paraw | 3 pax | ₱4,750 / night |
| Casablanca | 1–2 pax | ₱2,700 / night |
| Mix Dormitory | 1–6 pax | ₱1,350 / pax / night |

**Add-ons:** Day tour ₱500/person · Pet fee ₱500/pet

## Quick start

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and API keys from **Project Settings → API**
3. Copy database URLs from **Project Settings → Database**:
   - **Transaction pooler** → `DATABASE_URL` (port 6543, `?pgbouncer=true`)
   - **Direct connection** → `DIRECT_URL` (port 5432)

### 2. Configure environment

```bash
npm install
cp .env.example .env
# Fill in Supabase URL, keys, and database connection strings
```

### 3. Set up the database

Schema and seed live in `supabase/migrations/`. If the project is already linked:

```bash
npm run supabase:push          # apply migrations to Supabase
npm run supabase:upload-images # after filling .env with service role key
```

Or with Prisma (requires valid `DATABASE_URL`):

```bash
npx prisma generate
npx prisma db seed
```

### 4. Create the Storage bucket

In Supabase **Storage**, create a public bucket named `uploads` (or run the storage section in `supabase/migrations/001_initial_schema.sql`).

Uploads (room photos, payment QR, receipts) are stored here when Supabase is configured.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

**Partner sites:** See [docs/PARTNER.md](docs/PARTNER.md) for embed widgets, booking links, and the partner API.

Default admin credentials (change in `.env` before production):

- Email: `admin@lajuana.ops`
- Password: `admin123`

After first login, go to **Admin → Payment settings** and upload your GCash/Maya QR code.

## Tech stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Supabase Storage for uploads
- JWT session cookies for admin auth

## Production notes

1. Set strong `JWT_SECRET` and `ADMIN_PASSWORD` in your hosting env vars
2. Use Supabase **transaction pooler** URL for `DATABASE_URL` in production
3. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
4. Add email notifications on new bookings (e.g. Resend, SendGrid)
