import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  dateTimeToCommonDay,
  isoToCommonDateTime,
  ZONE_OPTIONS,
  ZoneSchema,
} from "@kronos/common";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { CustomTimeProvider } from "./lib/time";
import { JakimProvider } from "./lib/jakim";

type Bindings = {
  KronosKV: KVNamespace;
};

const server = new Hono<{ Bindings: Bindings }>();

// CORS middlware
server.use(
  "/*",
  cors({
    origin: "*",
  }),
);

server.get("/", (c) => {
  return c.json({ message: "Welcome to Kronos API" });
});

server.get("/selectionoptions", async (c) => {
  return c.json(ZONE_OPTIONS);
});

server.get(
  "/time/auto",
  zValidator(
    "query",
    z
      .object({
        date: z.string().datetime({ offset: true }),
        latitude: z.string(),
        longitude: z.string(),
        useJakimAdjustments: z.coerce.boolean(),
      })
      .required(),
  ),

  async (c) => {
    const { date, latitude, longitude, useJakimAdjustments } =
      c.req.valid("query");

    const time = new CustomTimeProvider();
    const res = await time.getTimeForDay(
      date,
      latitude,
      longitude,
      useJakimAdjustments,
    );
    return c.json(res);
  },
);

server.get(
  "/time/manual",
  zValidator(
    "query",
    z
      .object({
        date: z.string().datetime({ offset: true }),
        zone: ZoneSchema,
      })
      .required(),
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
