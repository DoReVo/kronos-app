import { assert, describe, test } from "vitest";
import { AladhanPrayerTimeProvider } from "./time";
import { DateTime } from "luxon";

describe("AladhanPrayerTimeProvider()", () => {
  test.skip("Fetch a time from the server", async () => {
    const s = new AladhanPrayerTimeProvider();

    const res = await s.getTimeForDay(DateTime.now().toISO(), "3.1358976", "101.613568");

    assert.isObject(res);
    console.log("response", res);
  });
});
