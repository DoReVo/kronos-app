import { describe, expect, it } from "vitest";
import type { PandemicSeries } from "@kronos/common";
import { addDays, dayDiff, pickYears, sliceSeries } from "./pandemic-slice";

describe("dayDiff", () => {
  it("returns 0 for the same date", () => {
    expect(dayDiff("2020-01-01", "2020-01-01")).toBe(0);
  });

  it("returns 1 for consecutive days", () => {
    expect(dayDiff("2020-01-01", "2020-01-02")).toBe(1);
  });

  it("returns 365 across a non-leap year", () => {
    expect(dayDiff("2021-01-01", "2022-01-01")).toBe(365);
  });

  it("returns 366 across a leap year", () => {
    expect(dayDiff("2020-01-01", "2021-01-01")).toBe(366);
  });

  it("crosses DST boundaries without rounding error", () => {
    expect(dayDiff("2025-03-08", "2025-03-10")).toBe(2);
    expect(dayDiff("2025-11-01", "2025-11-03")).toBe(2);
  });

  it("handles negative differences", () => {
    expect(dayDiff("2020-01-10", "2020-01-01")).toBe(-9);
  });
});

describe("addDays", () => {
  it("adds zero days as a no-op", () => {
    expect(addDays("2021-08-26", 0)).toBe("2021-08-26");
  });

  it("rolls month boundaries", () => {
    expect(addDays("2021-01-31", 1)).toBe("2021-02-01");
  });

  it("rolls year boundaries", () => {
    expect(addDays("2020-12-31", 1)).toBe("2021-01-01");
  });

  it("handles leap day correctly", () => {
    expect(addDays("2020-02-28", 1)).toBe("2020-02-29");
    expect(addDays("2020-02-29", 1)).toBe("2020-03-01");
  });

  it("subtracts days with a negative offset", () => {
    expect(addDays("2021-01-01", -1)).toBe("2020-12-31");
  });
});

describe("pickYears", () => {
  it("emits a single year when from and to share a year", () => {
    expect(pickYears("2021-03-01", "2021-12-31")).toEqual(["2021"]);
  });

  it("emits the full inclusive range across years", () => {
    expect(pickYears("2020-01-25", "2025-05-31")).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
    ]);
  });
});

function fixtureSeries(): PandemicSeries {
  // Two-year series, 5 days per year for compact reasoning.
  // Day index 0 → 2020-01-01.
  return {
    from: "2020-01-01",
    to: "2021-12-31",
    byState: {
      Malaysia: makeValues("2020-01-01", "2021-12-31", (i) => (i % 7 === 0 ? 1500 : 50)),
      Selangor: makeValues("2020-01-01", "2021-12-31", () => 100),
    },
  };
}

function makeValues(from: string, to: string, fn: (i: number) => number): number[] {
  const span = dayDiff(from, to) + 1;
  return Array.from({ length: span }, (_, i) => fn(i));
}

describe("sliceSeries", () => {
  it("returns the full range with year='all'", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Malaysia", "all");
    expect(result.from).toBe("2020-01-01");
    expect(result.to).toBe("2021-12-31");
    expect(result.values.length).toBe(dayDiff("2020-01-01", "2021-12-31") + 1);
  });

  it("filters to a specific year", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Malaysia", "2021");
    expect(result.from).toBe("2021-01-01");
    expect(result.to).toBe("2021-12-31");
    expect(result.values.length).toBe(365);
  });

  it("handles a leap year correctly", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Malaysia", "2020");
    expect(result.values.length).toBe(366);
  });

  it("clamps to series bounds when year extends past data", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Malaysia", "2022");
    expect(result.values).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.peak).toBeNull();
  });

  it("clamps to series bounds when year is before data", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Malaysia", "2019");
    expect(result.values).toEqual([]);
  });

  it("returns zeroed result for an unknown state", () => {
    const series = fixtureSeries();
    const result = sliceSeries(series, "Atlantis", "all");
    expect(result.values).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.peak).toBeNull();
    expect(result.mean).toBe(0);
  });

  it("computes peak and total correctly", () => {
    const series: PandemicSeries = {
      from: "2020-01-01",
      to: "2020-01-05",
      byState: { Malaysia: [10, 50, 200, 30, 5] },
    };
    const result = sliceSeries(series, "Malaysia", "all");
    expect(result.total).toBe(295);
    expect(result.peak).toEqual({ date: "2020-01-03", value: 200 });
    expect(result.mean).toBeCloseTo(59);
  });

  it("counts daysOverThreshold inclusively at the threshold value", () => {
    const series: PandemicSeries = {
      from: "2020-01-01",
      to: "2020-01-05",
      byState: { Malaysia: [999, 1000, 1001, 0, 5000] },
    };
    const result = sliceSeries(series, "Malaysia", "all", 1000);
    expect(result.daysOverThreshold).toBe(3);
  });

  it("handles an all-zero series with no peak", () => {
    const series: PandemicSeries = {
      from: "2020-01-01",
      to: "2020-01-03",
      byState: { Malaysia: [0, 0, 0] },
    };
    const result = sliceSeries(series, "Malaysia", "all");
    expect(result.total).toBe(0);
    expect(result.peak).toBeNull();
    expect(result.mean).toBe(0);
  });

  it("handles partial first year (data starts mid-year)", () => {
    const series: PandemicSeries = {
      from: "2020-06-01",
      to: "2020-12-31",
      byState: { Malaysia: makeValues("2020-06-01", "2020-12-31", () => 1) },
    };
    const result = sliceSeries(series, "Malaysia", "2020");
    expect(result.from).toBe("2020-06-01");
    expect(result.to).toBe("2020-12-31");
    expect(result.values.length).toBe(dayDiff("2020-06-01", "2020-12-31") + 1);
  });
});
