import { assert, describe, expect, test } from "vitest";
import { fetchTime } from "./time";

describe("fetchTime()", () => {
  test("Fetch a time from the server", async () => {
    const res = await fetchTime(
      "01-01-2025",
      "3.1383108409356315",
      "101.62518094982602",
    );

    assert.isObject(res);
    console.log("response", JSON.stringify(res));
  });
});
