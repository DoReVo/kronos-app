import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchTime } from "./lib/jakim";
import { ZONE_OPTIONS } from "@kronos/common";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

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
  "/time",
  zValidator(
    "query",
    z
      .object({
        date: z.string().datetime({ offset: true }),
      })
      .required(),
  ),
  async (c) => {
    const { date, zone } = c.req.query();

    const KV = c.env.KronosKV;

    const response = await fetchTime(zone, date, KV);
    return c.json(response);
  },
);

export default server;
