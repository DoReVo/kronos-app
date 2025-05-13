import { DayPrayerTime } from "@kronos/common";

export abstract class BasePrayerTimeProvider {
  API_URL: string | null = null;

  constructor() {}

  abstract fetchTimeForDay(
    date: string,
    latitude: string,
    longitude: string,
  ): unknown;

  abstract getTimeForDay(
    date: string,
    latitude: string,
    longitude: string,
  ): Promise<DayPrayerTime>;
}
