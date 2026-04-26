import type { CronProvider } from "./cron-provider";
import { ExchangeRateProvider } from "./exchange-rate";
import { PandemicProvider } from "./pandemic";

export function getProviders(): CronProvider<unknown>[] {
  return [new ExchangeRateProvider(), new PandemicProvider()];
}

export async function refreshAll(): Promise<void> {
  const providers = getProviders();
  const results = await Promise.allSettled(
    providers.map(async (p) => {
      await p.refreshAndCache();
      return p.kvKey;
    }),
  );
  for (const [i, result] of results.entries()) {
    const key = providers[i]?.kvKey ?? "?";
    if (result.status === "fulfilled") {
      console.log(`refreshed ${key}`);
    } else {
      console.error(`refresh failed for ${key}:`, result.reason);
    }
  }
}
