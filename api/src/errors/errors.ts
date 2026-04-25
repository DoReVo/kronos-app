import { DateTime } from "luxon";

export class TimeNotFound extends Error {
  constructor(time: DateTime<true>) {
    super(`Could not find time for day: ${time.toISO()}`);
    this.name = "TimeNotFound";
  }
}

export class UpstreamParseError extends Error {
  constructor(source: string, cause: unknown) {
    super(`Upstream response from ${source} did not match expected shape`, { cause });
    this.name = "UpstreamParseError";
  }
}
