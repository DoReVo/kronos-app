import { Hono } from "hono";
import { cors } from "hono/cors";
import { OPTIONS } from "./constant/constant";
import { fetchTime } from "./lib/jakim";

type Bindings = {
  KronosKV: KVNamespace;
};

const server = new Hono<{ Bindings: Bindings }>();

// CORS middlware
server.use(
  "/*",
  cors({
    origin: "*",
  })
);
server.get("/", (c) => {
  return c.json({ message: "Welcome to Kronos API" });
});

server.get("/selectionoptions", async (c) => {
  return c.json(OPTIONS);
});

server.get("/time", async (c) => {
  const { date, zone } = c.req.query();

  const KV = c.env.KronosKV;

  const response = await fetchTime(zone, date, KV);
  return c.json(response);
});

export default server;
