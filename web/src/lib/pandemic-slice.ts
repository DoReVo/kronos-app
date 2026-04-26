import { DateTime } from "luxon";
import type { PandemicSeries } from "@kronos/common";

export interface SliceResult {
  values: number[];
  from: string;
  to: string;
  total: number;
  peak: { date: string; value: number } | null;
  mean: number;
  daysOverThreshold: number;
}

export function dayDiff(from: string, to: string): number {
  return Math.round(
    DateTime.fromISO(to, { zone: "utc" }).diff(DateTime.fromISO(from, { zone: "utc" }), "days")
      .days,
  );
}

export function addDays(from: string, n: number): string {
  return DateTime.fromISO(from, { zone: "utc" }).plus({ days: n }).toISODate() ?? from;
}

export function pickYears(from: string, to: string): string[] {
  const start = DateTime.fromISO(from, { zone: "utc" }).year;
  const end = DateTime.fromISO(to, { zone: "utc" }).year;
  const out: string[] = [];
  for (let y = start; y <= end; y++) out.push(String(y));
  return out;
}

const DEFAULT_THRESHOLD = 1000;

export function sliceSeries(
  series: PandemicSeries,
  state: string,
  year: string,
  threshold: number = DEFAULT_THRESHOLD,
): SliceResult {
  const fullValues = series.byState[state] ?? [];
  const seriesFrom = series.from;

  let startIdx = 0;
  let endIdx = fullValues.length - 1;
  let from = seriesFrom;
  let to = series.to;

  if (year !== "all") {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const startOffset = dayDiff(seriesFrom, yearStart);
    const endOffset = dayDiff(seriesFrom, yearEnd);
    startIdx = Math.max(0, startOffset);
    endIdx = Math.min(fullValues.length - 1, endOffset);
    if (startIdx > endIdx) {
      return {
        values: [],
        from: yearStart,
        to: yearEnd,
        total: 0,
        peak: null,
        mean: 0,
        daysOverThreshold: 0,
      };
    }
    from = addDays(seriesFrom, startIdx);
    to = addDays(seriesFrom, endIdx);
  }

  const values = fullValues.slice(startIdx, endIdx + 1);
  let total = 0;
  let peakIdx = -1;
  let peakValue = -1;
  let daysOver = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    total += v;
    if (v > peakValue) {
      peakValue = v;
      peakIdx = i;
    }
    if (v >= threshold) daysOver++;
  }
  const peak =
    peakIdx >= 0 && peakValue > 0 ? { date: addDays(from, peakIdx), value: peakValue } : null;
  const mean = values.length > 0 ? total / values.length : 0;

  return { values, from, to, total, peak, mean, daysOverThreshold: daysOver };
}
