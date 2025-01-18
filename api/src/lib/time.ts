import { DayPrayerTime, DayPrayerTimeSchema } from "@kronos/common";
import ky, { HTTPError } from "ky";
import { DateTime } from "luxon";
import z from "zod";

abstract class BasePrayerTimeProvider {
  API_URL: string | null = null;

  constructor() {}

  protected abstract fetchTimeForDay(
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

export class AladhanPrayerTimeProvider extends BasePrayerTimeProvider {
  API_URL = "https://api.aladhan.com/v1";

  constructor() {
    super();
  }

  private getSearchParams(latitude: string, longitude: string): string {
    return new URLSearchParams({
      latitude,
      longitude,
      method: "17",
      shafaq: "general",
      tune: "",
      school: "0",
      midnightMode: "0",
      timezonestring: "UTC+08",
      iso8601: "true",
    }).toString();
  }

  protected async fetchTimeForDay(
    date: string,
    latitude: string,
    longitude: string,
  ) {
    const url = new URL(`${this.API_URL}/timings/${date}`);
    url.search = this.getSearchParams(latitude, longitude);

    try {
      const response = await ky.get(url).json();
      return this.parseResponse(response);
    } catch (error) {
      if (error instanceof HTTPError) {
        const errMsg = await error.response.json();
        console.log("Error", errMsg);
        throw new Error("HTTP Error", errMsg);
      } else throw error;
    }
  }

  private parseResponse(data: unknown) {
    const parsedData = z
      .object({
        data: z.object({
          timings: z.object({
            Fajr: z.string(),
            Sunrise: z.string(),
            Dhuhr: z.string(),
            Asr: z.string(),
            Maghrib: z.string(),
            Isha: z.string(),
            Imsak: z.string(),
          }),
          date: z.object({
            timestamp: z.coerce.number(),
          }),
        }),
      })
      .parse(data);

    const { timings: time, date } = parsedData.data;
    const datetime = DateTime.fromSeconds(date.timestamp);

    return DayPrayerTimeSchema.parse({
      date: datetime.toISO(),
      imsak: time.Imsak,
      syuruk: time.Sunrise,
      maghrib: time.Maghrib,
      subuh: time.Fajr,
      zohor: time.Dhuhr,
      asar: time.Asr,
      isyak: time.Isha,
    });
  }

  public async getTimeForDay(
    date: string,
    latitude: string,
    longitude: string,
  ): Promise<DayPrayerTime> {
    return await this.fetchTimeForDay(date, latitude, longitude);
  }
}
