import { Hono } from "hono";
import { cors } from "hono/cors";
import { dateTimeToCommonDay, isoToCommonDateTime, ZONE_OPTIONS, ZoneSchema } from "@kronos/common";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CustomTimeProvider } from "./lib/time";
import { JakimProvider } from "./lib/jakim";
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

    let datetime = isoToCommonDateTime(date);

    if (!datetime) {
      throw new Error("Invalid date given");
    }

    datetime = dateTimeToCommonDay(datetime);

    const time = new JakimProvider();
    const res = await time.getTimeForDay(datetime, zone);

    return c.json(res);
  },
);

export default server;
