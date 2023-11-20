import { assert, describe, expect, test } from "vitest";
import { AladhanPrayerTimeProvider, CustomTimeProvider } from "./time";
import * as RawCustom from "./custom.ts";
import { DateTime } from "luxon";
import { custom } from "joi";

describe("AladhanPrayerTimeProvider()", () => {
  test("Fetch a time from the server", async () => {
    const s = new AladhanPrayerTimeProvider();

    const res = await s.getTimeForDay(
      DateTime.now().toISO() ?? "",
      "3.1358976",
      "101.613568",
    );

    assert.isObject(res);
    console.log("response", res);
  });
});

describe("Internals produce same output for Custom Provider", () => {
  const customProvider = new CustomTimeProvider();

  test("Internals produce same output", async () => {
    assert.strictEqual(RawCustom.toRadians(1), customProvider.toRadians(1));
    assert.strictEqual(RawCustom.toDegrees(1), customProvider.toDegrees(1));

    const rawDate = new Date();
    const luxonDate = DateTime.now();

    assert.strictEqual(
      RawCustom.gregorianToJulian(rawDate),
      customProvider.gregorianToJulian(luxonDate),
    );
  });
});
