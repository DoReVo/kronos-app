import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZONE_OPTIONS, ZoneSchema } from "@kronos/common";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { DateTime } from "luxon";
import { CustomTimeProvider } from "./lib/time";
import { JakimProvider } from "./lib/jakim";
import { ExchangeRateProvider } from "./lib/exchange-rate";
import { PandemicProvider } from "./lib/pandemic";
import { refreshAll } from "./lib/cron-registry";
import { TimeNotFound, UpstreamParseError } from "./errors/errors";

const server = new Hono();

server.use(
  "/*",
  cors({
    origin: "*",
  }),
);

server.onError((err, c) => {
  if (err instanceof TimeNotFound) {
    return c.json({ error: "TimeNotFound", message: err.message }, 404);
  }
  if (err instanceof UpstreamParseError) {
    console.error(err);
    return c.json({ error: "UpstreamParseError", message: err.message }, 502);
  }
  console.error(err);
  return c.json({ error: "InternalServerError", message: "Internal server error" }, 500);
});

server.get("/", (c) => {
  return c.json({ message: "Welcome to Kronos API" });
});

server.get("/selectionoptions", (c) => {
  return c.json(ZONE_OPTIONS);
});

server.get(
  "/time/auto",
  zValidator(
    "query",
    z.object({
      date: z.iso.datetime({ offset: true }),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      useJakimAdjustments: z.enum(["true", "false"]).transform((v) => v === "true"),
    }),
  ),
  async (c) => {
    const { date, latitude, longitude, useJakimAdjustments } = c.req.valid("query");

    const time = new CustomTimeProvider();
    const res = await time.getTimeForDay(date, latitude, longitude, useJakimAdjustments);
    return c.json(res);
  },
);

server.get(
  "/time/manual",
  zValidator(
    "query",
    z.object({
      date: z.iso.datetime({ offset: true }),
      zone: ZoneSchema,
    }),
  ),
  async (c) => {
    const { date, zone } = c.req.valid("query");

    // Resolve the request to "which JAKIM day does this instant fall in, in
    // Asia/KL." Cache keys are KL-midnight expressed as the corresponding
    // UTC instant then floored to UTC startOf("day") (see jakim.ts).
    const datetime = DateTime.fromISO(date, { setZone: true })
      .setZone("Asia/Kuala_Lumpur")
      .startOf("day")
      .setZone("UTC")
      .startOf("day");

    if (!datetime.isValid) {
      throw new Error("Invalid date given");
    }

    const time = new JakimProvider();
    const res = await time.getTimeForDay(datetime, zone);

    return c.json(res);
  },
);

server.get("/currency/rates", async (c) => {
  const provider = new ExchangeRateProvider();
  const rates = await provider.getRates();
  return c.json(rates);
});

server.get("/pandemic/all", async (c) => {
  const provider = new PandemicProvider();
  const data = await provider.getDataset();
  return c.json(data);
});

export default {
  fetch: server.fetch,
  scheduled(_event: ScheduledController, _env: unknown, ctx: ExecutionContext): void {
    ctx.waitUntil(refreshAll());
  },
};
