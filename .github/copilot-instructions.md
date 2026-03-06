# flyteLog – Copilot Instructions

## Project Overview

**flyteLog** is a Next.js 16 (App Router) Electronic Flight Bag (EFB) for pilots — EASA-compliant logbook, VFR route planning, and OFP generation. Target: **PWA installed on desktop, tablet (iPad), and mobile (iPhone/Android)**. The app must feel native on every platform — not like a website.

**Aviation data scope is Poland only** (`country: 'PL'`). Do not add multi-country support without explicit instruction.

---

## Architecture

### Route Groups

```
app/(auth)/          → /login, /register — unauthenticated
app/(app)/           → guarded by session check in layout.tsx → redirects to /login
app/(app)/(features)/logbook/  → aircraft, glider, fstd
app/(app)/(features)/plan/     → route, ofp, weather
app/admin/           → role=ADMIN only
app/api/             → minimal; aero-data and auth endpoints only
```

### Dual Data Strategy (Critical)

Aviation geodata (airports, airspaces, navaids, obstacles) lives in **two places simultaneously**:

- **Online**: PostgreSQL via `/api/aero-data` (server-side, always filtered `country: 'PL'` — Poland only)
- **Offline**: IndexedDB via **Dexie** (`lib/dexie/db.ts`, database name `flytelogAero`)

The `useAeroData` hook (`hooks/use-aero-data.ts`) handles both sources transparently. **Never add a direct API call for VFR waypoint/search features** — always go through this hook or query Dexie directly for offline-first behaviour.

### Route Planning State

`RouteContext` (`components/route/route-context.tsx`) is the single source of truth for in-flight route planning. It is **in-memory only** — not persisted to the DB. `Leg` and `Waypoint` types are defined here and used across navlog, terrain, and map components.

---

## Key Patterns

### Auth (Auth.js v5 / next-auth beta)

- JWT strategy, credentials-only provider in `lib/auth.ts`
- Session fields extended in `types/next-auth.d.ts` — always check there before accessing `session.user.*`
- All server-side auth guards use `const session = await auth()` then check `session.user.role`
- New accounts require admin approval (`user.approved === true`) before login succeeds

### Server Actions

All mutations are `"use server"` functions, never API routes:

- `lib/auth-actions.ts` — register/login
- `lib/admin-actions.ts` — user management (requires `role === 'ADMIN'`)
- `lib/locale-actions.ts` — locale switching

### Prisma Client

Uses `PrismaPg` driver adapter (not standard connection URL):

```ts
// lib/prisma.ts — always import from here
import { prisma } from '@/lib/prisma';
```

Run migrations with `bunx prisma migrate dev`. **Never invent schema columns** — consult `prisma/schema.prisma` first.

### i18n

`next-intl` with **cookie-based locale** (no URL segments). Locale is read from the `locale` cookie; supported values: `en`, `pl`. Translations live in `messages/`. Use `useTranslations()` in client components and `getTranslations()` in server components.

### Terrain Elevation

`lib/terrain.ts` samples SRTM-encoded PNG tiles from `/public/terrain/`. Encoding: `elevation_m = R * 50`. Tiles are named by lat/lon (e.g. `N50E020.png`). This is **browser-only** (uses `canvas`).

### Navlog / Magnetic Declination

`lib/navlog.ts` computes per-leg navigation data. Magnetic declination uses the `geomagnetism` library. Bearings use `geolib` (`getRhumbLineBearing`, `getDistance`).

---

## UI Rules (PWA/Cockpit Context)

- **Mobile-first Tailwind**: base styles for small screens, then `md:` / `lg:`
- **`select-none`** on all interactive elements (buttons, cards, nav); allow selection only in `<input>` / `<textarea>`
- **Minimum 44×44px touch targets** (Apple HIG)
- **iOS safe areas**: use `pb-safe` / `pt-safe` or `env(safe-area-inset-bottom)` for bottom-docked UI
- **Haptics on primary actions**: `if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);`
- **Motion**: use `motion/react` (Framer Motion v12, imported as `motion/react`)
- **Toasts**: use `sonner` (`toast.success`, `toast.error`)
- **UI components**: extend from `components/ui/` (shadcn/ui). Add new primitives there, not inline.

---

## Code Quality — Clean Code (R. C. Martin)

- **Meaningful names**: variables, functions, and components must reveal intent. Avoid abbreviations except well-known domain terms (`NM`, `AGL`, `ICAO`, `OFP`).
- **Small, single-purpose functions**: each function does one thing. If a function needs a comment to explain what it does, refactor it.
- **No magic numbers**: extract constants with descriptive names (e.g. `OBSTACLE_BUFFER_FT = 300`, `METERS_PER_NM = 1852`).
- **Early returns over nested ifs**: use guard clauses at the top of functions.
- **Consistent abstractions**: don't mix server-side DB access with client-side Dexie queries in the same module.
- **Components stay presentational or stateful — not both**: separate data-fetching/logic hooks from rendering components.

---

## Developer Workflow

```bash
bun install          # install dependencies (Bun is the package manager)
bun dev              # start dev server on :3000
bunx prisma migrate dev   # apply schema changes
bunx prisma studio   # browse database
```

Aviation data seeding: `scripts/sync-openaip.ts` / `sync-node.ts` pull from OpenAIP API and seed the DB.

### Environment Variables (`.env`)

| Variable          | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `DATABASE_URL`    | Neon PostgreSQL connection string (pooled)  |
| `AUTH_SECRET`     | Auth.js JWT signing secret                  |
| `OPENAIP_API_KEY` | OpenAIP REST API key for aviation data sync |

All keys needed for local development are already present in `.env`. Do not add new environment variables without documenting them here.

---

## Git Conventions (2-Person Team)

- **Never commit directly to `main`** — always use `feature/` or `fix/` branches
- Only modify files in scope of the requested feature; don't refactor unrelated files
- Conventional commits: `feat(logbook): ...`, `fix(route): ...`, `chore(deps): ...`
- Open a PR for every feature; the second developer must review before merge
