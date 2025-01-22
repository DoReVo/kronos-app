import { describe, it } from "vitest";
import { calculatePrayerTimes } from "./custom";
import { CustomTimeProvider } from "./time";
import { DateTime } from "luxon";

describe("test", () => {
  it("works", async () => {
    const today = DateTime.now().setZone("UTC+09").toISO();
    console.log("Given date", today);

    console.log(
      "Function KL",
      calculatePrayerTimes(
        new Date(),
        3.151152512096102,
        101.70709983161986,
        8,
        false,
      ),
    );
    const provider = new CustomTimeProvider();

    console.log(
      "Class KL",
      await provider.getTimeForDay(
        today ?? "",
        "3.151152512096102",
        "101.70709983161986",
      ),
    );
  });
});
