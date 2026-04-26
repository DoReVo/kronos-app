import { PandemicDatasetSchema, type PandemicDataset, type PandemicSeries } from "@kronos/common";
import { DateTime } from "luxon";
import { CronProvider } from "./cron-provider";

const CASES_URL = "https://storage.data.gov.my/healthcare/covid_cases.parquet";
const DEATHS_URL = "https://storage.data.gov.my/healthcare/covid_deaths_linelist.parquet";

interface CasesRow {
  date: string;
  state: string;
  cases_new: bigint | number | null;
}

interface DeathsRow {
  date: string | Date;
  state: string;
}

interface PerStateRange {
  byState: Record<string, Record<string, number> | undefined>;
  from: string;
  to: string;
}

function isoDay(d: string | Date): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  return Math.round(
    DateTime.fromISO(to, { zone: "utc" }).diff(DateTime.fromISO(from, { zone: "utc" }), "days")
      .days,
  );
}

function num(v: bigint | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "bigint" ? Number(v) : v;
}

function densify({ byState, from, to }: PerStateRange): PandemicSeries {
  const span = dayDiff(from, to) + 1;
  const out: Record<string, number[]> = {};
  for (const [state, perDay] of Object.entries(byState)) {
    if (perDay === undefined) continue;
    const arr: number[] = Array.from({ length: span }, () => 0);
    for (const [date, v] of Object.entries(perDay)) {
      const i = dayDiff(from, date);
      if (i >= 0 && i < span) arr[i] = v;
    }
    out[state] = arr;
  }
  return { from, to, byState: out };
}

export class PandemicProvider extends CronProvider<PandemicDataset> {
  readonly kvKey = "pandemic-record-v1";
  readonly schema = PandemicDatasetSchema;

  getDataset(): Promise<PandemicDataset> {
    return this.get();
  }

  protected async refresh(): Promise<PandemicDataset> {
    const [cases, deaths] = await Promise.all([readCases(), readDeaths()]);

    const states = [
      ...new Set([...Object.keys(cases.byState), ...Object.keys(deaths.byState)]),
    ].toSorted((a, b) => {
      if (a === "Malaysia") return -1;
      if (b === "Malaysia") return 1;
      return a.localeCompare(b);
    });

    return {
      meta: {
        source: "MoH Malaysia via data.gov.my",
        sourceUrls: { cases: CASES_URL, deaths: DEATHS_URL },
        ingestedAt: new Date().toISOString(),
        casesFrom: cases.from,
        casesTo: cases.to,
        deathsFrom: deaths.from,
        deathsTo: deaths.to,
      },
      states,
      cases: densify(cases),
      deaths: densify(deaths),
    };
  }
}

// hyparquet-compressors's `compressors` export eagerly initializes hysnappy,
// which compiles WASM dynamically — Cloudflare Workers forbids that. We bypass
// the index by importing only the pure-JS BROTLI decoder, which is what our
// data.gov.my parquets actually use.
async function buildCompressors(): Promise<{
  BROTLI: (input: Uint8Array, length: number) => Uint8Array;
}> {
  const brotliMod = (await import("hyparquet-compressors/src/brotli.js")) as {
    decompressBrotli: (input: Uint8Array, length: number) => Uint8Array;
  };
  return { BROTLI: brotliMod.decompressBrotli };
}

// hyparquet returns Record<string, unknown>[]; the column filter we pass
// guarantees the shape matches CasesRow / DeathsRow at runtime.
function intoCasesRows(rows: unknown[]): CasesRow[] {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  return rows as CasesRow[];
}

function intoDeathsRows(rows: unknown[]): DeathsRow[] {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  return rows as DeathsRow[];
}

async function readCases(): Promise<PerStateRange> {
  const { asyncBufferFromUrl, parquetReadObjects } = await import("hyparquet");
  const compressors = await buildCompressors();
  const file = await asyncBufferFromUrl({ url: CASES_URL });
  const rows = intoCasesRows(
    await parquetReadObjects({
      file,
      compressors,
      columns: ["date", "state", "cases_new"],
    }),
  );

  const byState: Record<string, Record<string, number> | undefined> = {};
  let minDate: string | null = null;
  let maxDate: string | null = null;
  for (const r of rows) {
    const date = isoDay(r.date);
    const state = r.state;
    const v = num(r.cases_new);
    byState[state] ??= {};
    byState[state][date] = v;
    if (minDate === null || date < minDate) minDate = date;
    if (maxDate === null || date > maxDate) maxDate = date;
  }

  if (minDate === null || maxDate === null) {
    throw new Error("cases parquet returned zero rows");
  }
  return { byState, from: minDate, to: maxDate };
}

async function readDeaths(): Promise<PerStateRange> {
  const { asyncBufferFromUrl, parquetReadObjects } = await import("hyparquet");
  const compressors = await buildCompressors();
  const file = await asyncBufferFromUrl({ url: DEATHS_URL });
  const rows = intoDeathsRows(
    await parquetReadObjects({
      file,
      compressors,
      columns: ["date", "state"],
    }),
  );

  const byState: Record<string, Record<string, number> | undefined> = { Malaysia: {} };
  let minDate: string | null = null;
  let maxDate: string | null = null;
  for (const r of rows) {
    const date = isoDay(r.date);
    const state = r.state;
    byState[state] ??= {};
    byState[state][date] = (byState[state][date] ?? 0) + 1;

    const malaysia = byState.Malaysia!;
    malaysia[date] = (malaysia[date] ?? 0) + 1;

    if (minDate === null || date < minDate) minDate = date;
    if (maxDate === null || date > maxDate) maxDate = date;
  }

  if (minDate === null || maxDate === null) {
    throw new Error("deaths parquet returned zero rows");
  }
  return { byState, from: minDate, to: maxDate };
}
