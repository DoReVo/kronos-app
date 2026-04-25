# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

npm workspaces monorepo orchestrated by Turbo. Three packages:

- `common/` — `@kronos/common`: shared zod schemas (`PrayerTimeSchema`, `ZoneSchema`), `ZONE_OPTIONS` (Malaysian JAKIM prayer-time zones), and Luxon helpers. Compiled to `dist/` via `tsc`; both `api` and `web` import the built output, so `common` must be built before the others can typecheck or run.
- `api/` — `@kronos/api`: Cloudflare Worker (Hono) serving prayer times. Uses a KV namespace (binding name `kronos`) to cache JAKIM yearly data per zone.
- `web/` — `@kronos/web`: Vite + React 19 PWA, routed by TanStack Router (file-based). User preferences persist to IndexedDB.

## Commands

Run from the repo root unless noted:

- `npm run dev` — builds `@kronos/common` once, then `turbo run dev` brings up `api` (wrangler) and `web` (vite) in parallel. Use this as the default.
- `npm run start:server` / `npm run start:web` — run only one workspace's dev server.
- `npm run build` — `turbo run build` (respects `^build` so `common` builds first). The `web` build runs `tsc && vite build`, so stale `common/dist/` types surface here as type errors.
- `npm run test` — runs `vitest` across workspaces. To run a single test file in `api/`: `npm test -w api -- src/lib/jakim.test.ts`. The api package uses `@cloudflare/vitest-pool-workers`, which **requires `api/wrangler.toml` to exist** (see setup below).
- `npm run lint` — `turbo run lint` (no workspace currently defines a lint script).
- `npm run deploy -w api` — deploy the Worker via `wrangler deploy --minify`.

When you change anything in `common/src/`, either run `npm -w @kronos/common run dev` (watch mode) or rebuild it; otherwise `api`/`web` will see stale types from `common/dist/`.

## First-time setup

- `api/wrangler.toml` is gitignored. Copy `api/wrangler.example.toml` to `api/wrangler.toml` and fill in a real KV namespace `id` for the `kronos` binding. Without this file, `wrangler dev` and the api vitest pool both fail.
- `web/.env` needs `VITE_API_URL` (see `web/.env.example`); defaults to `http://localhost:4305`, the wrangler dev port. The web dev server itself runs on Vite's default `5173`.
- `api/bruno-collection/` has saved requests for the worker endpoints; open it in [Bruno](https://www.usebruno.com/) to hit `/time/auto` and `/time/manual` against the local wrangler dev server.

## Architecture notes

### Prayer-time providers (`api/src/lib/`)

`BasePrayerTimeProvider` (`provider.ts`) defines two overloaded `getTimeForDay` signatures — one for `(date, latitude, longitude)`, one for `(date, zone)`. Two concrete implementations exist:

- `CustomTimeProvider` (`time.ts`) — pure astronomical calculation from lat/long (Julian date → sun declination → equation of time → per-prayer angles). Powers `GET /time/auto`. Has an optional `useJakimAdjustments` flag that adds JAKIM's per-prayer offsets in minutes.
- `JakimProvider` (`jakim.ts`) — fetches a full year from `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<ZONE>`, normalizes each entry into the shared `PrayerTime` shape (UTC ISO strings keyed `imsak/subuh/syuruk/zohor/asar/maghrib/isyak`), and caches the parsed yearly array in KV under `<ZONE>-<YEAR>`. Subsequent same-year requests hit KV. Powers `GET /time/manual`.
- `AladhanPrayerTimeProvider` also lives in `time.ts` but is not currently wired into a route.

All times the api returns are ISO strings in UTC; the web converts to local display time with Luxon.

### Web state & data flow

- `src/atoms.ts` — jotai atoms (`methodAtom`, `latlongAtom`, `zoneAtom`) stored via `atomWithStorage` backed by `idb-keyval` (IndexedDB), so user preferences survive reloads and work offline-first alongside the PWA.
- `components/pages/prayer-time.tsx` is the only meaningful page. It runs two TanStack Query hooks (one for `auto`, one for `manual`); `enabled` flags gate which one fires based on `methodAtom`. `refetchInterval: 30000` polls every 30 s so times stay fresh without a route change.
- `api/ky.ts` exports a `createKy()` factory that returns a `ky` instance with `prefix: import.meta.env.VITE_API_URL`; pages call it once at module scope.
- Vite is configured with `@vitejs/plugin-react`, `vite-plugin-pwa` (autoUpdate), and `@tanstack/router-plugin/vite` — the router plugin must come *before* `@vitejs/plugin-react` in the plugins array. Tailwind v4 is wired through `@tailwindcss/vite`; there is no `tailwind.config.*`, configure via `src/styles/global.css`. UI primitives use `react-aria-components`. File-based routes live under `src/routes/`; the plugin writes `src/routeTree.gen.ts`, which is committed. If that file goes missing or is out of sync, `tsc` in `npm run build` fails before `vite` can regenerate it — bootstrap by running `npx vite build` (or `npm run dev`) inside `web/`, then commit.

### Shared package conventions

- `@kronos/common` re-exports everything from `utils.js` plus the schemas. Always import shared types/zod schemas from `@kronos/common` rather than redefining them; the api validates request payloads against the same schemas the common package exposes.
- `dateTimeToCommonDay` (start-of-day in UTC) is the canonical way to align dates before looking them up in `JakimProvider`'s yearly cache — date keys in cached JAKIM data are start-of-day UTC ISO strings.
- `PrayerTime` uses Malay field names (`imsak/subuh/syuruk/zohor/asar/maghrib/isyak`). JAKIM's upstream response uses English (`fajr/dhuhr/asr/isha`); the mapping lives in `JakimProvider._formatYearlyResponse` (`api/src/lib/jakim.ts`).
