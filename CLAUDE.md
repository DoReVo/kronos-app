# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

npm workspaces monorepo orchestrated by Turbo. Three packages:

- `common/` — `@kronos/common`: shared zod schemas (`PrayerTimeSchema`, `ZoneSchema`), `ZONE_OPTIONS` (Malaysian JAKIM prayer-time zones), and Luxon helpers. Compiled to `dist/` via `tsgo`; both `api` and `web` import the built output, so `common` must be built before the others can typecheck or run.
- `api/` — `@kronos/api`: Cloudflare Worker (Hono) serving prayer times. Uses a KV namespace (binding name `kronos`) to cache JAKIM yearly data per zone.
- `web/` — `@kronos/web`: Vite + React 19 PWA, routed by TanStack Router (file-based). User preferences persist to IndexedDB.

## Commands

Run from the repo root unless noted:

- `npm run dev` — builds `@kronos/common` once, then `turbo run dev` brings up `api` (wrangler) and `web` (vite) in parallel. Use this as the default.
- `npm run start:server` / `npm run start:web` — run only one workspace's dev server.
- `npm run build` — `turbo run build` (respects `^build` so `common` builds first). The `web` build runs `tsgo && vite build`, so stale `common/dist/` types surface here as type errors.
- `npm run test` — runs `vitest` across workspaces. To run a single test file in `api/`: `npm test -w api -- src/lib/jakim.test.ts`. The api package uses `@cloudflare/vitest-pool-workers`, which **requires `api/wrangler.toml` to exist** (see setup below).
- `npm run typecheck` — `turbo run typecheck`. All three workspaces define a `typecheck` script: `api/` and `web/` run `tsgo` (their tsconfigs already set `noEmit`); `common/` runs `tsgo --noEmit` (its tsconfig emits to `dist/`, so the flag is needed to override).
- `npm run lint` — `turbo run lint`. Each workspace runs `oxlint --type-aware --deny-warnings .`; tsgolint backs the type-aware rules. `--deny-warnings` makes warnings fail CI (and pre-commit). The `--type-aware` flag must be on the CLI, *not* in `.oxlintrc.json` — oxlint rejects `options.typeAware` when run from a workspace cwd because it treats the parent-found root config as nested.
- `npm run format` / `npm run format:check` — `oxfmt` per workspace, zero-config. Generated files are excluded via `'!path'` patterns in each workspace's `format` script (oxfmt has no `.oxfmtignore` — it reads `.gitignore`/`.prettierignore` only).
- `npm run deploy -w api` — deploy the Worker via `wrangler deploy --minify`.

### Git hooks (lefthook)

`lefthook.yml` defines two hooks; they self-install on `npm install` via the root `prepare` script.

- **pre-commit** — runs `oxfmt` then `oxlint --fix --deny-warnings` on staged `*.{ts,tsx,js,jsx,mjs,cjs}` files (excluding `web/src/routeTree.gen.ts` and `api/worker-configuration.d.ts`). Fixes are auto-restaged via `stage_fixed: true`. No `--type-aware` here — kept fast (sub-second).
- **pre-push** — runs `npx turbo run typecheck test lint` (full repo, type-aware). Mirrors what CI cares about so push-time failures match CI.

Bypass: `git commit --no-verify` / `git push --no-verify`, or `LEFTHOOK=0` in the env. CI doesn't need a guard — `npm ci` runs `prepare` and installs hooks into the runner's `.git`, but they only fire on git ops.

When you change anything in `common/src/`, either run `npm -w @kronos/common run dev` (watch mode) or rebuild it; otherwise `api`/`web` will see stale types from `common/dist/`.

## First-time setup

- `api/wrangler.toml` is committed (KV namespace IDs are public identifiers, not secrets). The `id` for the `kronos` binding must point at a real KV namespace for production deploys; vitest-pool-workers mocks the binding locally and in CI, so a placeholder id is tolerated for tests.
- `web/.env` needs `VITE_API_URL` (see `web/.env.example`); defaults to `http://localhost:4305`, the wrangler dev port. The web dev server itself runs on Vite's default `5173`.
- `api/bruno-collection/` has saved requests for the worker endpoints; open it in [Bruno](https://www.usebruno.com/) to hit `/time/auto` and `/time/manual` against the local wrangler dev server.
- **NixOS / wrangler dev TLS:** `workerd` reads the system CA store via `SSL_CERT_FILE`, but on NixOS the env var isn't exported by default, so every outbound `fetch()` from a local `wrangler dev` worker fails with `kj/compat/tls.c++:256: TLS peer's certificate is not trusted` (canonical issue: [workers-sdk#8158](https://github.com/cloudflare/workers-sdk/issues/8158); same root cause as `node:slim` Docker images that strip `ca-certificates`). `api/.envrc` exports `SSL_CERT_FILE` and `NODE_EXTRA_CA_CERTS` pointing at the NixOS bundle (`/etc/ssl/certs/ca-bundle.crt`); first-time setup is `direnv allow api`. A globally-set value (e.g. via home-manager) wins via `${VAR:-default}`. Production CF Workers have full CA trust; this only affects local dev. `--remote` doesn't help because the wrangler→CF tunnel uses the same TLS stack. Debian/Ubuntu's bundle lives at `/etc/ssl/certs/ca-certificates.crt` — override `SSL_CERT_FILE` in the shell or edit `.envrc`.

## Architecture notes

### Prayer-time providers (`api/src/lib/`)

`BasePrayerTimeProvider` (`provider.ts`) defines two overloaded `getTimeForDay` signatures — one for `(date, latitude, longitude)`, one for `(date, zone)`. Two concrete implementations exist:

- `CustomTimeProvider` (`time.ts`) — pure astronomical calculation from lat/long (Julian date → sun declination → equation of time → per-prayer angles). Powers `GET /time/auto`. Has an optional `useJakimAdjustments` flag that adds JAKIM's per-prayer offsets in minutes.
- `JakimProvider` (`jakim.ts`) — fetches a full year from `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=<ZONE>`, normalizes each entry into the shared `PrayerTime` shape (UTC ISO strings keyed `imsak/subuh/syuruk/zohor/asar/maghrib/isyak`), and caches the parsed yearly array in KV under `<ZONE>-<YEAR>`. Subsequent same-year requests hit KV. Powers `GET /time/manual`.
- `AladhanPrayerTimeProvider` also lives in `time.ts` but is not currently wired into a route.

All times the api returns are ISO strings in UTC; the web converts to local display time with Luxon.

- JAKIM upstream returns dates as `dd-MMM-yyyy` ("01-Jan-2026") and times as 24-hour `HH:mm:ss` ("05:43:00"). Test fixtures must match — Luxon's `TT` parser used in `_formatTime` rejects 12-hour `5:42:00 AM`.
- JAKIM date normalization is off by one for UTC-midnight queries: upstream "01-Jan-2025" parsed in Asia/KL then `setZone("UTC").startOf("day")` becomes `2024-12-31T00:00:00Z`. Cache lookups only match if the client query also normalizes to that day — pass KL-offset ISO (`2025-01-01T00:00:00+08:00`), not UTC midnight.
- HTTP error mapping lives in `server.onError` (`api/src/index.ts`): `TimeNotFound` → 404, `UpstreamParseError` → 502, default → 500. Routes/providers throw typed errors from `api/src/errors/errors.ts`; the handler sets the status. Don't `c.json(..., 4xx)` from inside route handlers.
- Zod query-param gotcha: `z.coerce.boolean()` treats `undefined` as `false` and any non-empty string (including `"false"`) as `true`. Use `z.enum(["true","false"]).transform(v => v === "true")` for boolean flags. Numeric query params: `z.coerce.number().min(...).max(...)`.

### API tests (vitest-pool-workers)

- Dispatch via `import { exports } from "cloudflare:workers"` then `exports.default.fetch(url)` — runs in the same isolate as tests, so `vi.stubGlobal` reaches the worker's `fetch`. `import "./index"` next to it triggers HMR rerun on entrypoint changes. `SELF` from `cloudflare:test` is the same thing but marked deprecated.
- `api/worker-globals.d.ts` declares `Cloudflare.GlobalProps['mainModule'] = typeof import("./src/index")` so `exports.default` is typed. Without it, `tsgo` rejects `.default`.
- `api/tsconfig.json` `types` must be `["@cloudflare/vitest-pool-workers/types"]` (subpath) — the `cloudflare:test` ambient module lives at that subpath, not at the bare package root.
- `api/wrangler.toml` requires `main = "src/index.ts"` for vitest-pool-workers to resolve the entrypoint. CLI args (`wrangler dev src/index.ts`) override at runtime, so the dev/deploy scripts still work.
- `fetchMock` from `cloudflare:test` is *not* exported in `@cloudflare/vitest-pool-workers@0.15.0`. Stub outbound fetch with `vi.stubGlobal("fetch", vi.fn<typeof fetch>(...))`; clean up via `vi.unstubAllGlobals()` in `afterEach`.
- KV writes are rolled back at end of each test file (per-file storage isolation, automatic). Across tests in the same file, use unique keys or explicit `env.kronos.delete(...)` in `beforeEach`.

### Toolchain (oxlint + oxfmt + tsgo)

- `tsgo` (`@typescript/native-preview`) replaces `tsc` everywhere. Drop-in CLI flag compatibility, but it's stricter about deprecated `tsconfig` options: `api/tsconfig.json` uses `moduleResolution: "bundler"` (was `"node"` — tsgo flags `node10` as removed), and `common/tsconfig.json` requires explicit `"rootDir": "./src"`.
- `api/tsconfig.json` keeps `skipLibCheck: true` deliberately — `worker-configuration.d.ts` (generated by `wrangler types`) collides on web globals (`Blob`, `URL`, `ReadableStream`, ~30 more) with `@types/node`, which `vitest 4` pulls in transitively via `undici`. Without `skipLibCheck` you get ~50 TS2300/TS6200 duplicate-identifier errors. `tsgo` here is `noEmit`-only — the worker is bundled by `wrangler deploy --minify`.
- oxlint inline-disable syntax is `// oxlint-disable-next-line <rule>` (or eslint-style `// eslint-disable-next-line` works too). Used in `web/src/atoms.ts` to suppress a misleading `no-redundant-type-constituents` triggered by jotai's `<any>` storage type.
- tsgo declaration emit for `common/` was risk-checked once — output matches tsc-equivalent, downstream packages typecheck cleanly. If `common`'s `.d.ts` ever drifts and breaks `api`/`web`, fall back to `tsc` in `common/build` only.

### Install / lockfile

- Use `npm ci` (CI uses lockfile, no resolution). For a fresh `npm install`, you need `--legacy-peer-deps` because `vite-plugin-pwa@1.x` peer-ranges only up to vite 7 but the project is on vite 8. Pre-existing condition; not from our changes.
- `oxlint-tsgolint` ships per-platform binaries via `optionalDependencies`. If the platform binary is missing post-install, wipe `node_modules` + `package-lock.json` and reinstall with `--legacy-peer-deps`.

### Web state & data flow

- `src/atoms.ts` — jotai atoms (`methodAtom`, `latlongAtom`, `zoneAtom`) stored via `atomWithStorage` backed by `idb-keyval` (IndexedDB), so user preferences survive reloads and work offline-first alongside the PWA.
- `components/pages/prayer-time.tsx` is the only meaningful page. It runs two TanStack Query hooks (one for `auto`, one for `manual`); `enabled` flags gate which one fires based on `methodAtom`. `refetchInterval: 30000` polls every 30 s so times stay fresh without a route change.
- `api/ky.ts` exports a `createKy()` factory that returns a `ky` instance with `prefix: import.meta.env.VITE_API_URL`; pages call it once at module scope.
- Vite is configured with `@vitejs/plugin-react`, `vite-plugin-pwa` (autoUpdate), and `@tanstack/router-plugin/vite` — the router plugin must come *before* `@vitejs/plugin-react` in the plugins array. Tailwind v4 is wired through `@tailwindcss/vite`; there is no `tailwind.config.*`, configure via `src/styles/global.css`. UI primitives use `react-aria-components`. File-based routes live under `src/routes/`; the plugin writes `src/routeTree.gen.ts`, which is committed. If that file goes missing or is out of sync, `tsc` in `npm run build` fails before `vite` can regenerate it — bootstrap by running `npx vite build` (or `npm run dev`) inside `web/`, then commit.

### Web design philosophy

The visual direction is **editorial-print almanac** — cream paper, warm ink, oxblood accent, distinctive italic display serif, restrained ornaments. These choices are locked; don't rebid them on each task. Concrete decisions:

- **Aesthetic**: Editorial almanac. Type and rule-lines do the work; no chrome, no shadows, no pill buttons, no rounded boxes. Marginalia (running heads, folios, dotted leaders) are the signature. Reference: real Apartamento / NYT-style print homages, not generic "magazine theme."
- **Type stack** (Pangram Pangram via Fontshare): **PP Editorial New** for display (italic for hero numerals, headlines, drop caps), **PP Mori** for body and small-caps kickers, **PP Fraktion Mono** for figures/folios/marginalia. Loaded via `<link rel="stylesheet">` in `web/index.html` — *not* `@import url()` in CSS (Tailwind v4 inlines its utilities at the position of `@import "tailwindcss";` so any later `@import url()` violates the spec rule that all `@import`s must come first).
- **Palette**: Light = paper `#f4ede0` / ink `#1a1612` / accent `#6e1d2a`; dark = paper `#161310` / ink `#efe6d4` / accent `#c4717c`. Tokens in `web/src/styles/global.css` `@theme`; dark overrides via `:root.dark { ... }` in `@layer base`. **Don't put a second `@theme` block inside `@media (prefers-color-scheme: dark)`** — Tailwind v4 collapses both at compile time and the dark values clobber the light defaults.
- **Theme toggle**: 3-way (light · system · dark) using React Aria's `ToggleButtonGroup` with `selectionMode="single"` + `disallowEmptySelection`. Persists to `localStorage.kronos_theme`. Pre-paint script in `index.html` sets the `.dark` class before React mounts to avoid flash. `@custom-variant dark (&:where(.dark, .dark *));` in `global.css` enables `dark:*` utilities. `useTheme()` hook listens to `prefers-color-scheme` changes for system mode.
- **Layout**: `__root.tsx` is plain (no motion); provides outer container `max-w-4xl` + theme toggle + `<QueryErrorBoundary>`. The Contents homepage uses the full `max-w-4xl`; utility pages wrap their own content in `max-w-2xl` for focused reading. Marginalia (running heads, folios, side captions) sit in gutters on desktop and collapse inline on mobile.
- **Navigation**: Contents-as-homepage. `/` is a typeset TOC; each utility page has a persistent `← contents` link in its `<RunningHead>`. No sidebar, no top navbar. "Forthcoming" entries (italic, no link, no folio) signal roadmap without false navigation.
- **Motion**: Single page-load reveal — staggered fade-up with subtle blur, ~0.6s total, easing `cubic-bezier(0.16, 1, 0.3, 1)`. After load the page is static. No hover lifts, no animated number transitions, no spinners — loading is a typeset italic kicker (`· fetching rates ·`). **Use direct `initial`/`animate` props on each motion element, never variants with name-based inheritance.** Motion's variant-context propagation is unreliable through TanStack Query's `<QueryErrorResetBoundary>` render prop — children stuck at `opacity: 0`. The `<PageItem delay={pageItemDelay(n)}>` helper in `components/page-frame.tsx` is the canonical wrapper.
- **Form controls (type-only)**: bare underlined inputs (oxblood underline on focus); `<ComboBox>` is a styled input + flat hairline-bordered popover; `<Switch>` is a typeset binary `[ off · on ]` with the active option underlined oxblood; `<RadioGroup>` (`MethodToggle`) is two typeset labels with italic descriptions, selected one underlined oxblood. No track/handle, no boxes.
- **Hero numerals**: PP Editorial New Italic at clamp sizes (`clamp(5rem,17vw,9rem)` for prayer hero, `clamp(3.75rem,15vw,7.5rem)` for currency "to" amount), `font-feature-settings: 'tnum'` for tabular alignment so digits don't jitter while typing.
- **Iconography**: `@iconify/tailwind4` + `@iconify/json` (all sets, build pulls only referenced icons via dynamic selector). Use `icon-[set--name]` syntax. Standardize on `lucide:*` for chrome (chevrons, arrows); `lucide:asterisk` is the recurring house ornament across masthead/divider/colophon. Don't sprinkle icons next to text labels — typography earns its place over icon-noise.
- **Atmosphere**: subliminal SVG grain at `web/public/grain.svg` (feTurbulence baseFrequency=1.4, opacity=0.25), tiled via `background-image` + `background-blend-mode: multiply` (light) / `screen` (dark) on `<body>`.
- **Editorial signatures (don't cut)**: drop cap on the editor's note (PP Editorial New roman against italic body, oxblood); Roman numeral chapter markers on TOC sections (`I — Applications`); `<TodayParticulars>` panel showing day-of-week/Hijri/Gregorian/sunrise/sunset/day-length/coords on the homepage; volume metadata strip; colophon at page bottom.
- **Copy voice**: direct, specific, names actual data sources ("JAKIM and the sun"). Avoid AI-italic phrases ("an experiment in treating utilities like artefacts"). The editor's note acknowledges the editorial chrome as affectation — that's intentional.
- **Errors**: `<EditorialError>` is the universal fallback — `ERRATUM` kicker + italic heading + mono error message between hairlines + "set again" typeset button. `QueryClient` defaults to `throwOnError: true` so all queries propagate to the nearest boundary; override per-query with `throwOnError: false` for graceful-degrade fetches (`useTodaySun()` does this so missing sun data quietly hides instead of nuking the homepage). `<QueryErrorBoundary>` wraps `<Outlet>` in `__root.tsx` (top-level catch) *and* each utility page's `PageContent` (so the theme toggle stays usable when a page errors).
- **Tailwind v4 quirks**: `@utility name` only accepts plain alphanumeric names — `@utility foo::before` is rejected; inline pseudo-element CSS instead of trying to define utilities for them.

#### Adding a new utility page

1. New route at `web/src/routes/<utility>.tsx` calling `createFileRoute("/<utility>")({ component: ... })`.
2. New page component at `web/src/components/pages/<utility>.tsx`.
3. Outer wrapper: `<div className="mx-auto w-full max-w-2xl flex flex-col gap-N">`.
4. Top: `<RunningHead section="Your Utility" folio="06" delay={pageItemDelay(0)} />` — use the next even folio in publication order (Prayer = 02, Currency = 04, ...).
5. Each section in `<PageItem delay={pageItemDelay(n)}>` with incrementing index for staggered entrance.
6. Bottom: `<FolioMark folio="06" delay={pageItemDelay(N)} />`.
7. Wrap the exported page component in `<QueryErrorBoundary>` if it uses queries.
8. Add a `live` entry to `sections` in `components/pages/contents.tsx` with the matching folio; remove the corresponding `forthcoming` entry.

### Shared package conventions

- `@kronos/common` re-exports everything from `utils.js` plus the schemas. Always import shared types/zod schemas from `@kronos/common` rather than redefining them; the api validates request payloads against the same schemas the common package exposes.
- `dateTimeToCommonDay` (start-of-day in UTC) is the canonical way to align dates before looking them up in `JakimProvider`'s yearly cache — date keys in cached JAKIM data are start-of-day UTC ISO strings.
- `PrayerTime` uses Malay field names (`imsak/subuh/syuruk/zohor/asar/maghrib/isyak`). JAKIM's upstream response uses English (`fajr/dhuhr/asr/isha`); the mapping lives in `JakimProvider._formatYearlyResponse` (`api/src/lib/jakim.ts`).

## CI/CD

- `.github/workflows/pr-checks.yml` — runs on PR and push to master: `npm ci`, `build`, `typecheck`, `test`, `lint`, `format:check`. The job key is `check`; that's the name to use in branch protection rulesets (status check names are job IDs, not workflow names, and rulesets don't accept wildcards).
- `.github/workflows/deploy-api.yml` — deploys the worker on push to master, gated by path filter (`api/**`, `common/**`, `package-lock.json`). Uses `cloudflare/wrangler-action@v3` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the GitHub `Production` environment.
- `.github/workflows/dependabot-auto-merge.yml` — listens for PRs from `dependabot[bot]`, uses `dependabot/fetch-metadata@v2` to inspect the update type, and runs `gh pr review --approve` + `gh pr merge --auto --squash` for `semver-patch` / `semver-minor`. Majors fall through and need human review. Auto-merge waits on the required status check, so a red CI blocks the merge.
- `.github/dependabot.yml` — weekly Monday 06:00 KL time. npm at `/` (covers all three workspaces). Groups: `tanstack` (`@tanstack/*`, all update types), `react` (`react`, `react-dom`, `@types/react*`, all update types), `types` (other `@types/*`, minor+patch only), `minor-and-patch` (catch-all, minor+patch only). Majors of non-grouped deps surface as individual PRs. github-actions also tracked weekly.
- The web app is deployed by Cloudflare Pages directly (auto-deploy on push to master, configured outside this repo) — no GitHub Actions step for it.
