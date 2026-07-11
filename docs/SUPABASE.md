# Moving to Supabase

Project URL: **https://dpczvvquimpqmagylbnw.supabase.co**  
Region: **ap-northeast-1**

The app uses Supabase for PostgreSQL (via Prisma) and file storage. Schema and seed data are in `supabase/migrations/`.

## What's already on Supabase

- Tables: `RoomType`, `Booking`, `Admin`, `Facility`, `Setting`
- Storage bucket: `uploads` (public read)
- Seed data: 6 rooms, 6 facilities, admin user (`admin@lajuana.ops` / `admin123`)

## Finish local setup

### 1. Get credentials

In [Supabase Dashboard](https://supabase.com/dashboard/project/dpczvvquimpqmagylbnw) → **Project Settings**:

**API** → copy `anon` and `service_role` keys  
**Database** → copy connection strings (use **ap-northeast-1** pooler host)

### 2. Update `.env`

```bash
NEXT_PUBLIC_SUPABASE_URL="https://dpczvvquimpqmagylbnw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
DATABASE_URL="postgresql://postgres.dpczvvquimpqmagylbnw:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.dpczvvquimpqmagylbnw:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 3. Upload images to Storage

Room and facility photos must be in the `uploads` bucket for Supabase image URLs to work:

```bash
npm run supabase:upload-images
```

Or with the linked Supabase CLI:

```bash
supabase --experimental storage cp --linked -r public/images/rooms ss:///uploads/rooms
supabase --experimental storage cp --linked -r public/images/facilities ss:///uploads/facilities
```

### 4. Run the app

```bash
npm run dev
```

## One-command setup (after `.env` is filled)

```bash
npm run supabase:setup
```

Pushes any pending migrations, uploads images (if keys are set), and runs Prisma seed.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `DATABASE_URL is not set` | Add Supabase connection strings to `.env` |
| `PrismaClientKnownRequestError` | Run `npm run supabase:push` |
| Connection timeout | Confirm pooler host is `aws-0-ap-northeast-1` |
| Room/facility images 404 | Run `npm run supabase:upload-images` |
| Upload fails | Create public `uploads` bucket (already in `001_initial_schema.sql`) |
