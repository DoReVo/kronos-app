import { CurrencyRates, CurrencyRatesSchema } from "@kronos/common";
import { z } from "zod";
import { DateTime } from "luxon";
import { env } from "cloudflare:workers";
import { UpstreamParseError } from "../errors/errors";

export const OPEN_ER_API_URL = "https://open.er-api.com/v6/latest/USD";
export const RATES_KV_KEY = "currency-rates";
const CACHE_TTL_SECONDS = 60 * 60 * 24;

const upstreamSchema = z.object({
  result: z.literal("success"),
  time_last_update_unix: z.number(),
  time_next_update_unix: z.number(),
  base_code: z.string().length(3),
  rates: z.record(z.string().length(3), z.number().positive()),
});

export class ExchangeRateProvider {
  async getRates(): Promise<CurrencyRates> {
    const cached = await this._getCached();
    if (cached) return cached;

    const fresh = await this._fetchUpstream();
    await env.kronos.put(RATES_KV_KEY, JSON.stringify(fresh), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
    return fresh;
  }

  async _getCached(): Promise<CurrencyRates | null> {
    const raw = await env.kronos.get(RATES_KV_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    return CurrencyRatesSchema.parse(parsed);
  }

  async _fetchUpstream(): Promise<CurrencyRates> {
    const response: unknown = await (await fetch(OPEN_ER_API_URL)).json();
    const validated = upstreamSchema.safeParse(response);
    if (!validated.success) {
      throw new UpstreamParseError("open.er-api.com latest", validated.error);
    }

    const { time_last_update_unix, time_next_update_unix, base_code, rates } = validated.data;

    return {
      base: base_code,
      fetchedAt: unixToISO(time_last_update_unix),
      nextUpdateAt: unixToISO(time_next_update_unix),
      rates,
    };
  }
}

function unixToISO(seconds: number): string {
  const dt = DateTime.fromSeconds(seconds, { zone: "UTC" });
  if (!dt.isValid) {
    throw new Error(`Cannot convert unix timestamp to ISO: ${seconds}`);
  }
  return dt.toISO();
}
