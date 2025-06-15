import {
  dateTimeToCommonDay,
  PrayerTime,
  PrayerTimeArraySchema,
  Zone,
} from "@kronos/common";
import { z } from "zod";
import { DateTime, DateTimeOptions } from "luxon";
import { BasePrayerTimeProvider } from "./provider";
import { env } from "cloudflare:workers";
import { TimeNotFound } from "../errors/errors";

const timeSchema = z.object({
  hijri: z.string(),
  date: z.string(),
  day: z.string(),
  imsak: z.string(),
  fajr: z.string(),
  syuruk: z.string(),
  dhuhr: z.string(),
  asr: z.string(),
  maghrib: z.string(),
  isha: z.string(),
});

type TimeResponse = z.infer<typeof timeSchema>;

const yearlyResponseSchema = z.object({
  prayerTime: z.array(timeSchema),
});

export class JakimProvider extends BasePrayerTimeProvider {
  API_URL = "https://www.e-solat.gov.my/index.php";

  sourceOpt: DateTimeOptions = { zone: "Asia/Kuala_Lumpur" };

  constructor() {
    super();
  }

  _generateZoneKey(zone: Zone, year: string) {
    return `${zone}-${year}`;
  }

  _formatTime(timeStr: string, date: DateTime<true>) {
    const time = DateTime.fromFormat(timeStr, "TT", this.sourceOpt);

    if (!time.isValid) {
      throw new Error(`Cannot parse time into luxon object: ${timeStr}`);
    }

    return date
      .set({
        hour: time.hour,
        minute: time.minute,
        second: time.second,
        millisecond: time.millisecond,
      })
      .toISO();
  }

  _formatYearlyResponse(data: TimeResponse[]): PrayerTime[] {
    return data.map((day) => {
      const date = DateTime.fromFormat(day.date, "dd-MMM-yyyy", this.sourceOpt)
        .toUTC()
        .startOf("day");

      if (!date.isValid) {
        throw new Error(`Cannot parse date into luxon object: ${day.date}`);
      }

      const dateStr = date.toISO();

      const dayData: PrayerTime = {
        date: dateStr,
        imsak: this._formatTime(day.imsak, date),
        subuh: this._formatTime(day.fajr, date),
        syuruk: this._formatTime(day.syuruk, date),
        zohor: this._formatTime(day.dhuhr, date),
        asar: this._formatTime(day.asr, date),
        maghrib: this._formatTime(day.maghrib, date),
        isyak: this._formatTime(day.isha, date),
      };

      return dayData;
    });
  }

  async _getYearlyForZone(zone: Zone): Promise<TimeResponse[]> {
    const url = new URL(this.API_URL);

    url.search = new URLSearchParams({
      r: "esolatApi/takwimsolat",
      period: "year",
      zone: zone,
    }).toString();

    let response = await (await fetch(url.toString())).json();

    const validatedData = yearlyResponseSchema.parse(response);
    return validatedData.prayerTime;
  }

  async _saveZoneData(zone: Zone, year: string, zoneData: PrayerTime[]) {
    const key = this._generateZoneKey(zone, year);

    const zoneDataStr = JSON.stringify(zoneData);

    await env.kronos.put(key, zoneDataStr);
  }

  async _getZoneData(zone: Zone, year: string) {
    const key = this._generateZoneKey(zone, year);
    const zoneData = await env.kronos.get(key);

    if (!zoneData) return null;

    const jsonZonedata: unknown = JSON.parse(zoneData);
    return PrayerTimeArraySchema.parse(jsonZonedata);
  }

  _findDayTime(
    parsedDate: DateTime<true>,
    yearly: PrayerTime[],
  ): PrayerTime | null {
    const dateStr = parsedDate.toISO();

    console.log(`Finding time of day of ${dateStr}`);

    const entry = yearly.find((entry) => {
      return entry.date === dateStr;
    });

    if (!entry) return null;

    return entry;
  }

  async fetchTimeForDay(
    parsedDate: DateTime<true>,
    zone: Zone,
  ): Promise<PrayerTime> {
    const year = parsedDate.year.toString();
    let yearlyData = await this._getZoneData(zone, year);

    if (!yearlyData) {
      console.log("Zone data does not exist", zone, year);
      const rawYearly = await this._getYearlyForZone(zone);
      yearlyData = this._formatYearlyResponse(rawYearly);
      await this._saveZoneData(zone, year, yearlyData);
    }

    const dateToFind = dateTimeToCommonDay(parsedDate);

    const entry = this._findDayTime(dateToFind, yearlyData);

    if (!entry) throw new TimeNotFound(dateToFind);

    return entry;
  }

  async getTimeForDay(date: DateTime<true>, zone: Zone): Promise<PrayerTime> {
    return await this.fetchTimeForDay(date, zone);
  }
}
