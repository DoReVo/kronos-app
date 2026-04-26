import { env } from "cloudflare:workers";

interface Schema<T> {
  parse(input: unknown): T;
}

export abstract class CronProvider<T> {
  abstract readonly kvKey: string;
  abstract readonly schema: Schema<T>;

  /** TTL in seconds for KV cache. Omit for indefinite. */
  readonly ttlSeconds?: number;

  /** Fetch upstream and produce the cache value. */
  protected abstract refresh(): Promise<T>;

  async getCached(): Promise<T | null> {
    const raw = await env.kronos.get(this.kvKey);
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.schema.parse(parsed);
    } catch {
      return null;
    }
  }

  async get(): Promise<T> {
    const cached = await this.getCached();
    if (cached !== null) return cached;
    return this.refreshAndCache();
  }

  async refreshAndCache(): Promise<T> {
    const fresh = await this.refresh();
    const validated = this.schema.parse(fresh);
    const opts = this.ttlSeconds === undefined ? undefined : { expirationTtl: this.ttlSeconds };
    await env.kronos.put(this.kvKey, JSON.stringify(validated), opts);
    return validated;
  }
}
