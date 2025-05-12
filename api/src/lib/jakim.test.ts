import { assert, describe, it } from "vitest";
import { JakimProvider } from "./jakim";
import { DateTime } from "luxon";

describe("Jakim Provider", async () => {
  it("Can fetch individual time", async () => {
    const provider = new JakimProvider();

    const today = DateTime.now();
    const response = await provider.getTimeForDay(today.toISO(), "SWK01");

    assert.isObject(response);

    console.log("response", response);
  });
});
