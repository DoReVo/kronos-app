import { assert, describe, expect, test } from "vitest";
import { AladhanPrayerTimeProvider } from "./time";

describe("AladhanPrayerTimeProvider()", () => {
  test("Fetch a time from the server", async () => {
    const s = new AladhanPrayerTimeProvider();

    const res = await s.getTimeForDay(
      "18-01-2025",
      "3.1402708778708965",
      "101.6238935909647",
    );

    assert.isObject(res);
    console.log("response", res);
  });
});
