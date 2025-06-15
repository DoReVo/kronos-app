import { PrayerTime, Zone } from "@kronos/common";
import { DateTime } from "luxon";

export abstract class BasePrayerTimeProvider {
  API_URL: string | null = null;

  constructor() {}

  abstract getTimeForDay(
    date: DateTime<true>,
    latitude: string,
    longitude: string,
  ): Promise<PrayerTime>;

  abstract getTimeForDay(
    datetime: DateTime<true>,
    zone: Zone,
  ): Promise<PrayerTime>;
}
