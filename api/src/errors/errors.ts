import { DateTime } from "luxon";

export class TimeNotFound extends Error {
  constructor(time: DateTime<true>) {
    super(`Could not find time for day: ${time.toISO()}`);
  }
}
