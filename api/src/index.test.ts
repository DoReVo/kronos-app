import { describe, expect, test } from "vitest";
import server from ".";
import { DateTime } from "luxon";

const sample = {
  code: 200,
  status: "OK",
  data: {
    timings: {
      Fajr: "2025-01-01T21:55:00+00:00",
      Sunrise: "2025-01-01T23:19:00+00:00",
      Dhuhr: "2025-01-01T05:17:00+00:00",
      Asr: "2025-01-01T08:41:00+00:00",
      Sunset: "2025-01-01T11:15:00+00:00",
      Maghrib: "2025-01-01T11:15:00+00:00",
      Isha: "2025-01-01T12:30:00+00:00",
      Imsak: "2025-01-01T21:45:00+00:00",
      Midnight: "2025-01-01T17:17:00+00:00",
      Firstthird: "2025-01-01T15:17:00+00:00",
      Lastthird: "2025-01-01T19:18:00+00:00",
    },
    date: {
      readable: "01 Jan 2025",
      timestamp: "1735714800",
      hijri: {
        date: "01-07-1446",
        format: "DD-MM-YYYY",
        day: "1",
        weekday: { en: "Al Arba'a", ar: "الاربعاء" },
        month: { number: 7, en: "Rajab", ar: "رَجَب", days: 30 },
        year: "1446",
        designation: { abbreviated: "AH", expanded: "Anno Hegirae" },
        holidays: ["Beginning of the holy months"],
        adjustedHolidays: [],
        method: "HJCoSA",
      },
      gregorian: {
        date: "01-01-2025",
        format: "DD-MM-YYYY",
        day: "01",
        weekday: { en: "Wednesday" },
        month: { number: 1, en: "January" },
        year: "2025",
        designation: { abbreviated: "AD", expanded: "Anno Domini" },
        lunarSighting: false,
      },
    },
    meta: {
      latitude: 3.1383108409356315,
      longitude: 101.62518094982602,
      timezone: "UTC",
      method: {
        id: 17,
        name: "Jabatan Kemajuan Islam Malaysia (JAKIM)",
        params: { Fajr: 20, Isha: 18 },
        location: { latitude: 3.139003, longitude: 101.686855 },
      },
      latitudeAdjustmentMethod: "ANGLE_BASED",
      midnightMode: "STANDARD",
      school: "STANDARD",
      offset: {
        Imsak: 0,
        Fajr: 0,
        Sunrise: 0,
        Dhuhr: 0,
        Asr: 0,
        Maghrib: 0,
        Sunset: 0,
        Isha: 0,
        Midnight: 0,
      },
    },
  },
};

describe("API server", async () => {
  test.skip("Return timing for the day", async () => {
    const params = new URLSearchParams({
      date: DateTime.now().toISO() ?? "",
    }).toString();

    const url = `/time?${params}`;

    const res = await server.request(
      url,
      {
        method: "GET",
      },
      { KronosKV: {} },
    );

    const body = await res.json();

    console.log("RESPONSE", body);
    expect(res.status).toBe(200);
  });
});

describe("Sandbox", async () => {
  test("Hehe", async () => {
    const myFunc = (val) => (String(val), Number());

    const x = myFunc(3);

    console.log(x);
  });
});
