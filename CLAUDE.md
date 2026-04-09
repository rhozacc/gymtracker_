# gymtracker_

## Brand
- Name: `gymtracker_` (lowercase, trailing underscore)
- Mobile-first PWA with biometric auth (WebAuthn)

## Tech Stack
- **Framework:** Next.js 14 App Router
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Data fetching:** SWR with localStorage fast-cache pattern
- **Charts:** Recharts (dynamically imported for code splitting)
- **Styling:** Tailwind CSS + CSS custom properties for theming
- **Auth:** WebAuthn biometrics (no passwords)

## Design System

### Themes
**Dark (default):**
- Background: `#0a0a0a`, Surface: `#111111`, Accent: `#39ff14` (neon green)
- Border: `#222222`, Text: `#e8e8e8`, Muted: `#666666`

**Light:**
- Background: `#f5f5f5`, Surface: `#ffffff`, Accent: `#d4622b` (burnt orange)
- Border: `#e0e0e0`, Text: `#111111`, Muted: `#888888`

### Typography
- Font: Geist Sans (variable)
- Weights: normal (body), medium (headings, labels), bold (stats)
- Section labels: `text-[10px] font-medium uppercase tracking-widest text-muted`

### Layout
- Max width: `max-w-lg` centered
- Page padding: `p-4` (1rem)
- Spacing: tight — `space-y-4` for sections, `space-y-2` for rows
- Cards: `border border-border rounded p-3` or `rounded-lg p-4`

### Components
- **CTAs:** `bg-accent text-bg font-medium rounded` (full width, h-12/h-14)
- **Secondary buttons:** `border border-border text-muted` or `text-muted text-sm`
- **Destructive buttons:** `border border-red-400 text-red-400`
- **Cards:** Border-based, no shadows. `border border-border rounded`
- **Inputs:** `bg-bg border border-border text-text text-sm rounded focus:border-accent`
- **Selected state:** `bg-accent text-bg ring-2 ring-accent/50`

### Animations
- Subtle fades: `transition-all duration-500`
- Nav beam sweep: CSS animation on active tab indicator
- Green flash on rest timer return: `bg-green-500/10` with 900ms timeout
- OverloadBanner: pulse border animation (preserve — "peak vibes")
- Rest timer: circular SVG progress with wake lock

### Visual Effects (dark mode only)
- Nav icon glow: `drop-shadow` on active icon
- Nav glow: radial gradient below nav pill, 8% opacity
- Chart bar glow: `drop-shadow` on recharts bars
- Streak cell glow: `box-shadow` on active heatmap cells

### Key Patterns
- **No emojis in UI.** Minimal inline SVG icons only.
- **Monochrome aesthetic** — single accent color, no multi-color schemes
- **Section labels** reused across pages for consistency
- **ChartSection** component wraps charts with inView fade-in animation
- **Dynamic imports** for all chart components (Recharts)
- **localStorage + SWR** pattern: localStorage for instant reads, SWR for DB sync

### Preserve
- OverloadBanner component and its pulse animation
- Monochrome aesthetic with accent-only color scheme
- Nav beam sweep transitions
- GitHub-style activity heatmap (single color, volume-based opacity)

## Project Structure
```
src/
  app/           — Next.js App Router pages + API routes
  components/    — React components (client-side)
  lib/           — Utilities, hooks, shared logic
  hooks/         — Custom React hooks
prisma/          — Database schema
public/          — Static assets, manifest, service worker
```

## Key Conventions
- All page/component files use `"use client"` directive
- Unit conversion always stored as kg in DB, converted on display
- Weight conversion: `kgToDisplay()` / `displayToKg()` from `lib/units`
- E1RM: Epley formula `weight * (1 + reps / 30)` in `lib/e1rm.ts`
- Plans stored in DB (`Plan` model), enriched with static metadata from `lib/program.ts`
- Guided session backup: `localStorage BACKUP_KEY` for crash recovery
