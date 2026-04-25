import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { CustomTimeProvider } from "./time";
import wly01 from "../../test-fixtures/jakim/WLY01-2026.json";
import png01 from "../../test-fixtures/jakim/PNG01-2026.json";
import jhr02 from "../../test-fixtures/jakim/JHR02-2026.json";
import sbh07 from "../../test-fixtures/jakim/SBH07-2026.json";
import swk08 from "../../test-fixtures/jakim/SWK08-2026.json";

interface JakimDay {
  date: string;
  imsak: string;
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface Fixture {
  zone: string;
  year: number;
  place: string;
  coordinate: { latitude: number; longitude: number };
  days: JakimDay[];
}

const FIXTURES: Fixture[] = [wly01, png01, jhr02, sbh07, swk08];

const PRAYER_PAIRS = [
  { jakim: "imsak", custom: "imsak" },
  { jakim: "fajr", custom: "subuh" },
  { jakim: "syuruk", custom: "syuruk" },
  { jakim: "dhuhr", custom: "zohor" },
  { jakim: "asr", custom: "asar" },
  { jakim: "maghrib", custom: "maghrib" },
  { jakim: "isha", custom: "isyak" },
] as const;

function jakimToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function customToMinutes(iso: string): number {
  const dt = DateTime.fromISO(iso, { setZone: true });
  if (!dt.isValid) throw new Error(`Invalid ISO from CustomTimeProvider: ${iso}`);
  return dt.hour * 60 + dt.minute;
}

function dateForCalc(jakimDate: string): string {
  const dt = DateTime.fromFormat(jakimDate, "dd-MMM-yyyy", { zone: "Asia/Kuala_Lumpur" });
  if (!dt.isValid) throw new Error(`Cannot parse JAKIM date: ${jakimDate}`);
  return dt.startOf("day").toISO();
}

const provider = new CustomTimeProvider();

describe.each(FIXTURES)("$zone ($place)", (fixture) => {
  const { latitude, longitude } = fixture.coordinate;

  describe.each([
    { useAdj: true, tolerance: 3 },
    { useAdj: false, tolerance: 15 },
  ])("useJakimAdjustments=$useAdj (±$tolerance min)", ({ useAdj, tolerance }) => {
    describe.each(fixture.days)("$date", (day) => {
      const dateISO = dateForCalc(day.date);
      const result = provider.fetchTimeForDay(dateISO, latitude, longitude, useAdj);

      it.each(PRAYER_PAIRS)("$jakim", ({ jakim, custom }) => {
        const jakimStr = day[jakim];
        const customStr = result[custom];
        const jakimMin = jakimToMinutes(jakimStr);
        const customMin = customToMinutes(customStr);
        const rawDiff = Math.abs(jakimMin - customMin);
        const diff = rawDiff > 720 ? 1440 - rawDiff : rawDiff;

        expect
          .soft(
            diff,
            `${jakim}: jakim=${jakimStr} custom=${customStr.slice(11, 16)} diff=${diff}min`,
          )
          .toBeLessThanOrEqual(tolerance);
      });
    });
  });
});
