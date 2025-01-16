import { describe, expect, test } from "vitest";
import server from ".";
import { DateTime } from "luxon";

describe("API server", async () => {
  test("Return timing for the day", async () => {
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
