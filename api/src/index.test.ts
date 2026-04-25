import { env, exports } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrayerTimeSchema, ZONE_OPTIONS, type Zone } from "@kronos/common";
import { JAKIM_API_URL } from "./lib/jakim";
import "./index";

afterEach(() => {
  vi.unstubAllGlobals();
});

const ORIGIN = "https://kronos.test";

const validAuto = {
  date: "2025-01-01T00:00:00+00:00",
  latitude: "3.139",
  longitude: "101.687",
  useJakimAdjustments: "false",
};

const validManual = {
  date: "2025-01-01T00:00:00+00:00",
  zone: "JHR01",
};

function url(path: string, params?: Record<string, string>) {
  const u = new URL(path, ORIGIN);
  if (params) u.search = new URLSearchParams(params).toString();
  return u.toString();
}

function withoutKey<T extends Record<string, string>>(
  obj: T,
  key: keyof T,
): Record<string, string> {
  const { [key]: _, ...rest } = obj;
  return rest;
}

describe("smoke", () => {
  it("GET / returns the welcome message", async () => {
    const res = await exports.default.fetch(url("/"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ message: "Welcome to Kronos API" });
  });

  it("GET /selectionoptions returns ZONE_OPTIONS", async () => {
    const res = await exports.default.fetch(url("/selectionoptions"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(ZONE_OPTIONS);
  });

  it("unknown path returns 404", async () => {
    const res = await exports.default.fetch(url("/does-not-exist"));
    expect(res.status).toBe(404);
  });
});

describe("CORS", () => {
  it("includes Access-Control-Allow-Origin on a normal GET", async () => {
    const res = await exports.default.fetch(url("/"));
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("answers OPTIONS preflight", async () => {
    const res = await exports.default.fetch(url("/time/auto"), {
      method: "OPTIONS",
      headers: {
        Origin: "https://web.example",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    expect([200, 204]).toContain(res.status);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("GET /time/auto", () => {
  it.each(["date", "latitude", "longitude", "useJakimAdjustments"] as const)(
    "rejects missing %s with 400",
    async (param) => {
      const res = await exports.default.fetch(url("/time/auto", withoutKey(validAuto, param)));
      expect(res.status).toBe(400);
    },
  );

  it("rejects a non-ISO date with 400", async () => {
    const res = await exports.default.fetch(
      url("/time/auto", { ...validAuto, date: "2025-01-01" }),
    );
    expect(res.status).toBe(400);
  });

  it.each([
    ["non-numeric latitude", { latitude: "not-a-number" }],
    ["non-numeric longitude", { longitude: "abc" }],
    ["latitude out of range", { latitude: "200" }],
    ["longitude out of range", { longitude: "-300" }],
  ] as const)("rejects %s with 400", async (_label, overrides) => {
    const res = await exports.default.fetch(url("/time/auto", { ...validAuto, ...overrides }));
    expect(res.status).toBe(400);
  });

  it.each(["yes", "1", "0", ""] as const)(
    "rejects useJakimAdjustments=%s with 400",
    async (value) => {
      const res = await exports.default.fetch(
        url("/time/auto", { ...validAuto, useJakimAdjustments: value }),
      );
      expect(res.status).toBe(400);
    },
  );

  it("returns 200 and a PrayerTime-shaped body for a valid query", async () => {
    const res = await exports.default.fetch(url("/time/auto", validAuto));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => PrayerTimeSchema.parse(body)).not.toThrow();
  });
});

describe("GET /time/manual: validation", () => {
  it.each(["date", "zone"] as const)("rejects missing %s with 400", async (param) => {
    const res = await exports.default.fetch(url("/time/manual", withoutKey(validManual, param)));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown zone with 400", async () => {
    const res = await exports.default.fetch(url("/time/manual", { ...validManual, zone: "XXX99" }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-ISO date with 400", async () => {
    const res = await exports.default.fetch(
      url("/time/manual", { ...validManual, date: "not-a-date" }),
    );
    expect(res.status).toBe(400);
  });
});

function buildUpstreamDay(dateStr: string) {
  return {
    hijri: "1-Rajab-1446",
    date: dateStr,
    day: "Sunday",
    imsak: "05:42:00",
    fajr: "05:52:00",
    syuruk: "07:15:00",
    dhuhr: "13:15:00",
    asr: "16:39:00",
    maghrib: "19:13:00",
    isha: "20:28:00",
  };
}

type UpstreamResponder = (urlStr: string) => Response | null;

function respondJakim(zone: Zone, body: unknown): UpstreamResponder {
  return (urlStr) =>
    urlStr.startsWith(JAKIM_API_URL) &&
    urlStr.includes(`zone=${zone}`) &&
    urlStr.includes("period=year")
      ? Response.json(body)
      : null;
}

function stubUpstream(...responders: UpstreamResponder[]) {
  const fetchSpy = vi.fn<typeof fetch>((input) => {
    const urlStr = new Request(input).url;
    for (const responder of responders) {
      const res = responder(urlStr);
      if (res) return Promise.resolve(res);
    }
    return Promise.reject(new Error(`Unmocked outbound fetch: ${urlStr}`));
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

describe("GET /time/manual: upstream + KV cache", () => {
  beforeEach(async () => {
    await Promise.all(
      ["JHR01-2025", "JHR02-2025", "JHR01-2026"].map((key) => env.kronos.delete(key)),
    );
  });

  it("fetches upstream on cache miss, writes KV, returns a PrayerTime body", async () => {
    const fetchSpy = stubUpstream(
      respondJakim("JHR01", { prayerTime: [buildUpstreamDay("15-Jun-2025")] }),
    );

    const res = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => PrayerTimeSchema.parse(body)).not.toThrow();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(await env.kronos.get("JHR01-2025")).not.toBeNull();
  });

  it("serves from KV on cache hit and does not call upstream", async () => {
    const fetchSpy = stubUpstream();
    const seeded = [
      {
        date: "2025-06-14T00:00:00.000Z",
        imsak: "2025-06-14T21:42:00.000Z",
        subuh: "2025-06-14T21:52:00.000Z",
        syuruk: "2025-06-14T23:15:00.000Z",
        zohor: "2025-06-15T05:15:00.000Z",
        asar: "2025-06-15T08:39:00.000Z",
        maghrib: "2025-06-15T11:13:00.000Z",
        isyak: "2025-06-15T12:28:00.000Z",
      },
    ];
    await env.kronos.put("JHR01-2025", JSON.stringify(seeded));

    const res = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(seeded[0]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("re-fetches upstream when a different year is requested", async () => {
    const fetchSpy = stubUpstream(
      respondJakim("JHR01", {
        prayerTime: [buildUpstreamDay("15-Jun-2025"), buildUpstreamDay("15-Jun-2026")],
      }),
    );

    const r2025 = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(r2025.status).toBe(200);

    const r2026 = await exports.default.fetch(
      url("/time/manual", { date: "2026-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(r2026.status).toBe(200);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(await env.kronos.get("JHR01-2025")).not.toBeNull();
    expect(await env.kronos.get("JHR01-2026")).not.toBeNull();
  });

  it("returns 404 when the requested date is not in the cached year", async () => {
    stubUpstream();
    await env.kronos.put("JHR01-2025", JSON.stringify([]));

    const res = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 502 when upstream payload is malformed", async () => {
    stubUpstream(respondJakim("JHR02", { wrong: "shape" }));

    const res = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR02" }),
    );
    expect(res.status).toBe(502);
  });
});

describe("CORS on error", () => {
  beforeEach(async () => {
    await env.kronos.delete("JHR01-2025");
  });

  it("preserves Access-Control-Allow-Origin on a 404 response", async () => {
    stubUpstream();
    await env.kronos.put("JHR01-2025", JSON.stringify([]));

    const res = await exports.default.fetch(
      url("/time/manual", { date: "2025-06-15T00:00:00+08:00", zone: "JHR01" }),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
