# Gym Tracker

Personal gym tracker with progressive overload detection. Dark, mobile-first, PIN-protected.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rhozacc/gymtracker_&env=APP_PIN&envDescription=4-digit+PIN+to+protect+your+app&project-name=gymtracker)

**Demo PIN: `0000`** — try it on the live deployment. Deploy your own copy for a private instance with your own PIN.

## Features

- 4 built-in training plans (Upper/Lower, Push/Pull/Legs, Gym Bro 5-day, Arnold Split) + custom plan builder
- Progressive overload detection — tells you when to increase weight
- Session logging with per-set tracking (weight, reps, RIR)
- Rest timer between sets
- Post-session debrief (energy, pump, mood)
- Weekly volume charts
- Activity streak calendar
- Session history with detail views
- Unit toggle (kg/lbs)
- PIN-protected single-user (no auth library)
- Dark mode

## Stack

Next.js 14 (App Router) / TypeScript / Tailwind CSS / Prisma / Neon Postgres / Recharts / SWR

## Deploy to Vercel

1. Click the deploy button above
2. Set `APP_PIN` to a 4-digit PIN when prompted
3. Add a Neon Postgres database from the [Vercel Marketplace](https://vercel.com/marketplace/neon) and link it to your project — this auto-sets `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`
4. Push the database schema:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   ```

## Local Development

```bash
git clone https://github.com/rhozacc/gymtracker_.git && cd gymtracker_
cp .env.example .env.local
# Fill in your Postgres connection strings and PIN
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Neon pooled connection string (auto-set by Vercel Marketplace) |
| `POSTGRES_URL_NON_POOLING` | Neon direct connection string (auto-set by Vercel Marketplace) |
| `APP_PIN` | 4-digit PIN to access the app |

When deploying via the button, the Postgres variables are provisioned automatically. You only need to set `APP_PIN`.
