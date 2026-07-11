# Deploy to Vercel

## 1. Push to GitHub (recommended)

```bash
git init   # if needed
git add .
git commit -m "Initial commit"
gh repo create la-juana-resort --private --source=. --push
```

Or create a repo on GitHub and push manually.

## 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Build command: `npm run build` (default)
5. Install command: `npm install` (default)

## 3. Environment variables

In Vercel → Project → **Settings → Environment Variables**, add every variable from `.env.example`:

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | Long random string for admin sessions |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_NAME` | Display name |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never expose |
| `DATABASE_URL` | Supabase **transaction pooler** (port 6543) |
| `DIRECT_URL` | Supabase **direct** connection (port 5432) |

Apply to **Production**, **Preview**, and **Development**.

## 4. Deploy

Click **Deploy**. Vercel runs `prisma generate` during `npm run build`, then `next build`.

## 5. After deploy

- Open your site URL and test `/`, `/book`, `/admin`
- Admin: use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env vars
- Database and storage are already on Supabase — no extra setup on Vercel

## CLI deploy (alternative)

```bash
npx vercel login
npx vercel link
npx vercel env pull   # or add vars in dashboard
npx vercel --prod
```
