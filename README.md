# gymtracker_

Personal gym tracker with progressive overload detection. Dark, mobile-first.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rhozacc/gymtracker_&env=APP_PIN&envDescription=4-digit+PIN+to+protect+your+app&project-name=gymtracker)

**Demo PIN: `0000`** — try it on the live deployment. Deploy your own copy for a private instance with your own PIN.

<p align="center">
  <img src=".github/screenshots/dashboard.png" width="200" alt="Dashboard" />
  <img src=".github/screenshots/log-session.png" width="200" alt="Log session" />
  <img src=".github/screenshots/plan.png" width="200" alt="Training plans" />
  <img src=".github/screenshots/charts.png" width="200" alt="Charts" />
</p>

## Features

**Training plans** — 4 built-in splits (Upper/Lower, Push/Pull/Legs, Gym Bro 5-day, Arnold) plus a custom plan builder. Switch plans anytime; history is always preserved.

**Session logging** — Per-set tracking of weight, reps, and RIR (Reps in Reserve). Add or remove sets on the fly. Unit toggle between kg and lbs.

**Guided mode** — Step-by-step session walkthrough with automatic rest timers, screen wake lock, and background notifications when the timer ends.

**Smart overload feedback** — Uses your rep range and RIR data to give three-tier advice:
- *Go up* (green) — you hit the reps comfortably (RIR 2+), time to add weight
- *Almost ready* (amber) — you hit the reps but were grinding (RIR 0-1), repeat the weight to lock it in
- No RIR recorded? Falls back to rep-range-only logic so the feature works either way

**Post-session debrief** — Rate energy, pump, and mood (1-5) after each session.

**Charts & history** — Weekly volume by day type, exercise-specific weight progression, 12-week activity heatmap, full session history with detail views.

**PIN-protected** — Simple 4-digit PIN gate. No auth library, no accounts — just you and your data.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · Neon Postgres · Recharts · SWR

## Deploy to Vercel

1. Click the deploy button above
2. Set `APP_PIN` to a 4-digit PIN when prompted
3. Add a Neon Postgres database from the [Vercel Marketplace](https://vercel.com/marketplace/neon) and link it to your project — this auto-sets `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`
4. Push the database schema:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   ```

## Local development

```bash
git clone https://github.com/rhozacc/gymtracker_.git && cd gymtracker_
cp .env.example .env.local
# Fill in your Postgres connection strings and PIN
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Neon pooled connection string (auto-set by Vercel Marketplace) |
| `POSTGRES_URL_NON_POOLING` | Neon direct connection string (auto-set by Vercel Marketplace) |
| `APP_PIN` | 4-digit PIN to access the app |

When deploying via the button, the Postgres variables are provisioned automatically. You only need to set `APP_PIN`.
