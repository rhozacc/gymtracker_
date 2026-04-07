# Gym Tracker

Minimal personal gym tracker with progressive overload detection. Dark, dense, mobile-first. Built for logging sessions in the gym on your phone.

## Features

- Hardcoded 3-day upper/lower/full body split
- Progressive overload detection — tells you when to increase weight
- Volume tracking with weekly charts
- Session history with detailed set logs
- Activity streak calendar
- PIN-protected (single user, no auth library)

## Stack

Next.js 14 (App Router) / TypeScript / Tailwind CSS / Prisma / Vercel Postgres / Recharts

## Deploy to Vercel

1. Fork or clone this repo
2. Create a new project on [Vercel](https://vercel.com)
3. In the Vercel dashboard, go to **Storage** and create a **Postgres** database. Link it to your project — this auto-sets `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`
4. Add an environment variable: `APP_PIN` = your 4-digit PIN (e.g. `1234`)
5. Deploy
6. After the first deploy, run the database migration:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   ```
   Or trigger a redeploy — the schema will be pushed on first use.

## Local Development

```bash
git clone <repo-url> && cd gymtracker
cp .env.example .env.local
# Fill in your Postgres connection strings and PIN in .env.local
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PRISMA_URL` | Vercel Postgres pooled connection string |
| `POSTGRES_URL_NON_POOLING` | Vercel Postgres direct connection string |
| `APP_PIN` | 4-digit PIN to access the app |
