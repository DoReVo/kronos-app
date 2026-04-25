import { PrayerTime, PrayerTimeSchema } from "@kronos/common";
import ky, { HTTPError } from "ky";
import { DateTime } from "luxon";
import { z } from "zod";
import { BasePrayerTimeProvider } from "./provider";

export class AladhanPrayerTimeProvider extends BasePrayerTimeProvider {
  API_URL = "https://api.aladhan.com/v1";

  getSearchParams(latitude: string, longitude: string): string {
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

  async fetchTimeForDay(date: string, latitude: string, longitude: string) {
    const formattedDate = DateTime.fromISO(date).toFormat("dd-LL-yyyy");
    const url = new URL(`${this.API_URL}/timings/${formattedDate}`);
    url.search = this.getSearchParams(latitude, longitude);
    console.log("Fetching time for", formattedDate, latitude, longitude);

    try {
      const response = await ky.get(url).json();
      return this.parseResponse(response);
    } catch (error) {
      if (error instanceof HTTPError) {
        const errMsg: unknown = await error.response.json();
        console.log("Error", errMsg);
        throw new Error("HTTP Error", { cause: error });
      } else throw error;
    }
  }

  parseResponse(data: unknown) {
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

    return PrayerTimeSchema.parse({
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

  public getTimeForDay(date: string, latitude: string, longitude: string): Promise<PrayerTime> {
    return this.fetchTimeForDay(date, latitude, longitude);
  }
}

export class CustomTimeProvider extends BasePrayerTimeProvider {
  // JAKIM Prayer time parameters
  PRAYER_PARAMS = {
    subuh: 20,
    isyak: 18,
    imsak: 20,
    dhuha: 4.5,
    asrFactor: 1,
    imsakOffset: -10,
  };

  // JAKIM adjustments in minutes
  JAKIM_ADJUSTMENTS: Record<keyof Omit<PrayerTime, "date">, number> = {
    imsak: 12,
    subuh: 12,
    syuruk: 0,
    zohor: 3,
    asar: 2,
    maghrib: 2,
    isyak: 2,
  };

  // Convert degrees to radians
  toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Convert radians to degrees
  toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  // Convert Gregorian date to Julian date
  gregorianToJulian(date: DateTime): number {
    let year = date.year;
    let month = date.month;
    let day = date.day;

    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd =
      Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;

    return jd;
  }

  // Calculate sun declination
  getSunDeclination(jd: number): number {
    const d = jd - 2451545.0;
    const g = 357.529 + 0.98560028 * d;
    const q = 280.459 + 0.98564736 * d;
    const l = q + 1.915 * Math.sin(this.toRadians(g)) + 0.02 * Math.sin(this.toRadians(2 * g));

    const e = 23.439 - 0.00000036 * d;
    const delta = Math.asin(Math.sin(this.toRadians(e)) * Math.sin(this.toRadians(l)));

    return this.toDegrees(delta);
  }

  // Calculate equation of time
  getEquationOfTime(jd: number) {
    const d = jd - 2451545.0;
    const g = 357.529 + 0.98560028 * d;
    const q = 280.459 + 0.98564736 * d;
    const l = q + 1.915 * Math.sin(this.toRadians(g)) + 0.02 * Math.sin(this.toRadians(2 * g));

    const e = 23.439 - 0.00000036 * d;
    const ra = this.toDegrees(
      Math.atan2(
        Math.cos(this.toRadians(e)) * Math.sin(this.toRadians(l)),
        Math.cos(this.toRadians(l)),
      ),
    );

    return (q - ra) / 15;
  }

  // Calculate time based on angle
  getTimeByAngle(params: {
    angle: number;
    latitude: number;
    longitude: number;
    sunDeclination: number;
    zohor: number;
    isNight?: boolean;
  }): number | null {
    const { angle, latitude, longitude: _, sunDeclination, zohor, isNight = false } = params;

    const term1 = -Math.sin(this.toRadians(angle));
    const term2 = Math.sin(this.toRadians(latitude)) * Math.sin(this.toRadians(sunDeclination));
    const term3 = Math.cos(this.toRadians(latitude)) * Math.cos(this.toRadians(sunDeclination));

    const cosValue = (term1 - term2) / term3;

    if (Math.abs(cosValue) > 1) {
      return null;
    }

    const T = this.toDegrees(Math.acos(cosValue)) / 15;
    return zohor + (isNight ? T : -T);
  }

  // Calculate Asr time
  calculateAsar(params: { latitude: number; sunDeclination: number; zohor: number }): number {
    const { latitude, sunDeclination, zohor } = params;

    // Convert to radians once
    const decl = this.toRadians(sunDeclination);
    const lat = this.toRadians(latitude);

    // Get Asr shadow ratio (Shafi'i method)
    const shadowRatio = 1 + Math.tan(Math.abs(lat - decl));

    // Calculate Asr angle with higher precision
    const asrAngle = Math.atan(1 / shadowRatio);

    // Calculate hour angle with full precision
    const numerator = Math.sin(asrAngle) - Math.sin(lat) * Math.sin(decl);
    const denominator = Math.cos(lat) * Math.cos(decl);
    const H = Math.acos(numerator / denominator);

    // Convert to hours with minimal rounding
    const T = this.toDegrees(H) / 15;

    // Apply final adjustment for JAKIM standard
    return zohor + T;
  }

  // Calculate Fajr time
  calculateSubuh(params: {
    latitude: number;
    longitude: number;
    sunDeclination: number;
    zohor: number;
  }): number | null {
    return this.getTimeByAngle({
      ...params,
      angle: this.PRAYER_PARAMS.subuh,
      isNight: false,
    });
  }

  formatTimeWithLuxon(decimalHours: number | null): string | null {
    if (decimalHours === null) return null;

    // First, normalize the hours to be within 0-24
    let normalizedHours = decimalHours % 24;
    if (normalizedHours < 0) normalizedHours += 24;

    // Convert decimal hours to hours and minutes
    const hours = Math.floor(normalizedHours);
    const minutes = Math.floor((normalizedHours - hours) * 60);

    // Create a DateTime object set to today with our calculated hours and minutes
    const time = DateTime.now().set({
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
    });

    // Format the time in 24-hour format
    return time.toISO();
  }

  private applyJakimAdjustments(times: Record<keyof PrayerTime, number | null | string>): void {
    const keys: (keyof Omit<PrayerTime, "date">)[] = [
      "imsak",
      "subuh",
      "syuruk",
      "zohor",
      "asar",
      "maghrib",
      "isyak",
    ];
    for (const prayer of keys) {
      const value = times[prayer];
      if (typeof value === "number") {
        times[prayer] = value + this.JAKIM_ADJUSTMENTS[prayer] / 60;
      }
    }
  }

  private calculateRawTimes(
    _date: DateTime,
    commonParams: { latitude: number; longitude: number; sunDeclination: number; zohor: number },
  ): Record<keyof PrayerTime, number | null | string> {
    const times: Record<keyof PrayerTime, number | null | string> = {
      date: _date.toISO() ?? "",
      subuh: this.calculateSubuh(commonParams),
      imsak: null,
      syuruk: this.getTimeByAngle({ ...commonParams, angle: 0.833, isNight: false }),
      zohor: commonParams.zohor,
      asar: this.calculateAsar(commonParams),
      maghrib: this.getTimeByAngle({ ...commonParams, angle: 0.833, isNight: true }),
      isyak: this.getTimeByAngle({
        ...commonParams,
        angle: this.PRAYER_PARAMS.isyak,
        isNight: true,
      }),
    };

    if (typeof times.subuh === "number") {
      times.imsak = times.subuh + this.PRAYER_PARAMS.imsakOffset / 60;
    }
    return times;
  }

  // Main calculation function
  fetchTimeForDay(
    date: string,
    latitude: number,
    longitude: number,
    useJakimAdjustments: boolean = false,
  ): PrayerTime {
    const _date = DateTime.fromISO(date);
    const jd = this.gregorianToJulian(_date);
    const zohor = 12 + _date.offset / 60 - longitude / 15 - this.getEquationOfTime(jd);

    const commonParams = {
      latitude,
      longitude,
      sunDeclination: this.getSunDeclination(jd),
      zohor,
    };

    const times = this.calculateRawTimes(_date, commonParams);

    if (useJakimAdjustments) this.applyJakimAdjustments(times);

    const fmt = (v: number | null | string): string => {
      if (typeof v === "number") return this.formatTimeWithLuxon(v) ?? "";
      return v ?? "";
    };

    return {
      date: typeof times.date === "string" ? times.date : "",
      imsak: fmt(times.imsak),
      subuh: fmt(times.subuh),
      syuruk: fmt(times.syuruk),
      zohor: fmt(times.zohor),
      asar: fmt(times.asar),
      maghrib: fmt(times.maghrib),
      isyak: fmt(times.isyak),
    };
  }

  getTimeForDay(
    date: string,
    latitude: number,
    longitude: number,
    useJakimAdjustments: boolean = false,
  ): Promise<PrayerTime> {
    return Promise.resolve(this.fetchTimeForDay(date, latitude, longitude, useJakimAdjustments));
  }
}
