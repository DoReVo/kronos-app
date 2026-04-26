# Kronos

A private almanac of utilities, kept for personal use. Malaysian-focused:
prayer times by JAKIM zones or astronomical calculation from a coordinate,
currency rates against the US dollar. Forthcoming: timezone converter, unit
converter, net pay calculator (Malaysian taxation, after subtraction).

The volume numbers, Hijri dates, and editorial chrome are a small affectation —
the data is the part that's real. Pages are added when wanted, not on a schedule.

## Stack at a glance

npm workspaces + Turbo. Three packages:

- `common` — shared zod schemas + Luxon helpers; built first
- `api` — Cloudflare Worker (Hono) on KV cache; serves `/time/auto`, `/time/manual`, `/currency/rates`
- `web` — Vite + React 19 PWA; jotai + IndexedDB for prefs

- Use react aria for UI components - <https://react-aria.adobe.com/llms.txt> (Replace llms.txt with the component path)

## Footguns

- **JAKIM date off-by-one**: pass KL-offset ISO (`...+08:00`) for `/time/manual`, not UTC midnight — JAKIM dates parsed in Asia/KL then converted to UTC start-of-day land on the previous calendar day.

## Web design philosophy

The visual direction is **editorial-print almanac** — cream paper, warm ink,
oxblood accent, distinctive italic display serif, restrained ornaments. These
choices are locked; don't rebid them on each task.

- **Aesthetic**: Type and rule-lines do the work; no chrome, no shadows, no pill buttons, no rounded boxes. Marginalia (running heads, folios, dotted leaders) are the signature. Reference: real Apartamento / NYT-style print homages, not generic "magazine theme."
- **Type stack** (Pangram Pangram): **PP Editorial New** for display (italic for hero numerals, headlines, drop caps), **PP Mori** for body and small-caps kickers, **PP Fraktion Mono** for figures, folios, marginalia.
- **Palette**:
  - Light: paper `#f4ede0` / ink `#1a1612` / accent `#6e1d2a`
  - Dark: paper `#161310` / ink `#efe6d4` / accent `#c4717c`
- **Theme toggle**: 3-way (light · system · dark), persisted across reloads, no flash on first paint.
- **Layout**: contents homepage uses a wider container; utility pages narrower for focused reading. Marginalia sit in gutters on desktop, collapse inline on mobile.
- **Navigation**: Contents-as-homepage. `/` is a typeset table of contents; each utility has a persistent `← contents` link. No sidebar, no top navbar. "Forthcoming" entries are italic, unlinked, and have no folio — they signal roadmap without false navigation.
- **Motion**: Single page-load reveal — staggered fade-up with subtle blur, ~0.6s total. After load the page is static. No hover lifts, no animated number transitions, no spinners. Loading is a typeset italic kicker (`· fetching rates ·`).
- **Form controls (type-only)**: bare underlined inputs (oxblood underline on focus). ComboBox is a styled input + flat hairline-bordered popover. Switch is a typeset binary `[ off · on ]` with the active option underlined oxblood. Radio is two typeset labels with italic descriptions, selected one underlined. No track/handle, no boxes.
- **Hero numerals**: PP Editorial New Italic at fluid clamp sizes, tabular figures so digits don't jitter while typing.
- **Iconography**: standardize on lucide for chrome (chevrons, arrows). `lucide:asterisk` is the recurring house ornament across masthead, dividers, and colophon. Don't sprinkle icons next to text labels — typography earns its place over icon-noise.
- **Atmosphere**: subliminal SVG grain tiled over the paper background; `multiply` blend in light mode, `screen` in dark.
- **Editorial signatures (don't cut)**: drop cap on the editor's note (PP Editorial New roman against italic body, oxblood); Roman numeral chapter markers on TOC sections (`I — Applications`); Today's Particulars panel on the homepage showing day-of-week / Hijri / Gregorian / sunrise-sunset / day length / coords; volume metadata strip; colophon at page bottom.
- **Copy voice**: direct, specific, names actual data sources ("JAKIM and the sun"). Avoid AI-italic phrases ("an experiment in treating utilities like artefacts"). The editor's note acknowledges the editorial chrome as affectation — that's intentional.
- **Errors**: the universal fallback is an `ERRATUM` kicker + italic heading + the actual error message in mono between hairlines + a "set again" typeset button. Per-page boundaries so a page-level error doesn't take out the theme toggle or the contents link.

### Folio numbering

Pages are numbered in publication order using even folios: Prayer = `02`, Currency = `04`. Forthcoming pages get the next even folio when they go live.
