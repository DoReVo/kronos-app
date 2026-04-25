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

// Convergence threshold: 1 second expressed as a fraction of a day.
const ITERATION_EPSILON = 1 / 86400;
const MAX_ITERATIONS = 3;

interface SolarKernel {
  /** Sun's declination, in degrees. */
  decl: number;
  /** Equation of time, in hours (apparent − mean). */
  eot: number;
}

interface SolarInterpolators {
  decl: (n: number) => number;
  eot: (n: number) => number;
}

export class CustomTimeProvider extends BasePrayerTimeProvider {
  PRAYER_PARAMS = {
    subuh: 20,
    isyak: 18,
    imsak: 20,
    dhuha: 4.5,
    asrFactor: 1,
    imsakOffset: -10,
  };

  // JAKIM adjustments in minutes. Empirically calibrated against JAKIM's
  // published yearly takwimsolat — our raw astronomical calc differs from
  // JAKIM's by a small offset, so applying their documented +12 for
  // fajr/imsak overshoots. See api/src/lib/time.parity.test.ts.
  JAKIM_ADJUSTMENTS: Record<keyof Omit<PrayerTime, "date">, number> = {
    imsak: 11,
    subuh: 11,
    syuruk: 0,
    zohor: 3,
    asar: 2,
    maghrib: 2,
    isyak: 2,
  };

  toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  // JD at 0h UT of the date components in `date.zone`. The fractional ".5" comes
  // from JD's noon-anchored convention.
  gregorianToJulian(date: DateTime): number {
    let year = date.year;
    let month = date.month;
    const day = date.day;

    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    return (
      Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5
    );
  }

  private _norm360(deg: number): number {
    const r = deg % 360;
    return r < 0 ? r + 360 : r;
  }

  // Meeus "Astronomical Algorithms" 2e, ch. 25 — medium-precision (~5″).
  private _solarParams(jd: number) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = this._norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = this._norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const Mrad = this.toRadians(M);
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
      0.000289 * Math.sin(3 * Mrad);
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const omegaRad = this.toRadians(omega);
    const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omegaRad);
    const meanObliquity = 23.439291 - 0.0130042 * T;
    const obliquity = meanObliquity + 0.00256 * Math.cos(omegaRad);
    return { L0, M, e, appLong, obliquity };
  }

  // Both products of the solar position calc, derived once from `_solarParams`.
  // Equation of time uses Meeus 28.3, accurate to ~0.01 min.
  private _solarKernel(jd: number): SolarKernel {
    const p = this._solarParams(jd);
    const decl = this.toDegrees(
      Math.asin(Math.sin(this.toRadians(p.obliquity)) * Math.sin(this.toRadians(p.appLong))),
    );
    const epsHalf = this.toRadians(p.obliquity / 2);
    const y = Math.tan(epsHalf) * Math.tan(epsHalf);
    const L0r = this.toRadians(p.L0);
    const Mr = this.toRadians(p.M);
    const eotRad =
      y * Math.sin(2 * L0r) -
      2 * p.e * Math.sin(Mr) +
      4 * p.e * y * Math.sin(Mr) * Math.cos(2 * L0r) -
      0.5 * y * y * Math.sin(4 * L0r) -
      1.25 * p.e * p.e * Math.sin(2 * Mr);
    const eot = (this.toDegrees(eotRad) * 4) / 60;
    return { decl, eot };
  }

  // Bessel interpolation, Meeus ch. 3. y1, y2, y3 sit at equally spaced points
  // (here jd-1, jd, jd+1); n is the fractional offset from y2 in days.
  private _interpolate(y1: number, y2: number, y3: number, n: number): number {
    const a = y2 - y1;
    const b = y3 - y2;
    const c = b - a;
    return y2 + (n / 2) * (a + b + n * c);
  }

  // Sample sun coords at midnight UT for prev/today/next, then expose
  // closures that interpolate to any fractional day from baseJD.
  private _solarInterpolators(baseJD: number): SolarInterpolators {
    const prev = this._solarKernel(baseJD - 1);
    const curr = this._solarKernel(baseJD);
    const next = this._solarKernel(baseJD + 1);
    return {
      decl: (n) => this._interpolate(prev.decl, curr.decl, next.decl, n),
      eot: (n) => this._interpolate(prev.eot, curr.eot, next.eot, n),
    };
  }

  // Hour angle (in hours) for the sun at `angle` below/above the horizon.
  // Returns null when the sun never reaches the angle (polar regions).
  private _hourAngle(angle: number, latitude: number, declination: number): number | null {
    const term1 = -Math.sin(this.toRadians(angle));
    const term2 = Math.sin(this.toRadians(latitude)) * Math.sin(this.toRadians(declination));
    const term3 = Math.cos(this.toRadians(latitude)) * Math.cos(this.toRadians(declination));
    const cosValue = (term1 - term2) / term3;
    if (Math.abs(cosValue) > 1) return null;
    return this.toDegrees(Math.acos(cosValue)) / 15;
  }

  // Iteratively refine an angle-based prayer time. Sun coords get re-interpolated
  // at the candidate instant and the time recomputed; converges in 2–3 passes
  // for non-polar latitudes. Lifts precision from ~9 sec (single-pass) to <1 sec.
  private _refineByAngle(
    angle: number,
    latitude: number,
    longitude: number,
    offsetHours: number,
    interp: SolarInterpolators,
    isNight: boolean,
  ): number | null {
    let nFrac = 0;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const decl = interp.decl(nFrac);
      const eot = interp.eot(nFrac);
      const transit = 12 + offsetHours - longitude / 15 - eot;
      const T = this._hourAngle(angle, latitude, decl);
      if (T === null) return null;
      const localHours = transit + (isNight ? T : -T);
      const newN = (localHours - offsetHours) / 24;
      if (Math.abs(newN - nFrac) < ITERATION_EPSILON) {
        nFrac = newN;
        break;
      }
      nFrac = newN;
    }
    return nFrac * 24 + offsetHours;
  }

  private _refineTransit(
    longitude: number,
    offsetHours: number,
    interp: SolarInterpolators,
  ): number {
    let nFrac = 0;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const eot = interp.eot(nFrac);
      const localHours = 12 + offsetHours - longitude / 15 - eot;
      const newN = (localHours - offsetHours) / 24;
      if (Math.abs(newN - nFrac) < ITERATION_EPSILON) {
        nFrac = newN;
        break;
      }
      nFrac = newN;
    }
    return nFrac * 24 + offsetHours;
  }

  // Asr (Shafi'i): time when shadow length equals object height plus the
  // shadow length at noon. Iterates the shadow-angle formula at the candidate.
  private _refineAsar(
    latitude: number,
    longitude: number,
    offsetHours: number,
    interp: SolarInterpolators,
  ): number {
    let nFrac = 0;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const decl = interp.decl(nFrac);
      const eot = interp.eot(nFrac);
      const transit = 12 + offsetHours - longitude / 15 - eot;

      const declRad = this.toRadians(decl);
      const latRad = this.toRadians(latitude);
      const shadowRatio = 1 + Math.tan(Math.abs(latRad - declRad));
      const asrAngle = Math.atan(1 / shadowRatio);
      const numerator = Math.sin(asrAngle) - Math.sin(latRad) * Math.sin(declRad);
      const denominator = Math.cos(latRad) * Math.cos(declRad);
      const T = this.toDegrees(Math.acos(numerator / denominator)) / 15;

      const localHours = transit + T;
      const newN = (localHours - offsetHours) / 24;
      if (Math.abs(newN - nFrac) < ITERATION_EPSILON) {
        nFrac = newN;
        break;
      }
      nFrac = newN;
    }
    return nFrac * 24 + offsetHours;
  }

  formatTimeWithLuxon(decimalHours: number | null, baseDate: DateTime): string | null {
    if (decimalHours === null) return null;
    let normalizedHours = decimalHours % 24;
    if (normalizedHours < 0) normalizedHours += 24;
    let totalMinutes = Math.round(normalizedHours * 60);
    if (totalMinutes >= 1440) totalMinutes -= 1440;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return baseDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 }).toISO();
  }

  fetchTimeForDay(
    date: string,
    latitude: number,
    longitude: number,
    useJakimAdjustments: boolean = false,
  ): PrayerTime {
    const _date = DateTime.fromISO(date);
    const baseJD = this.gregorianToJulian(_date);
    const offsetHours = _date.offset / 60;
    const interp = this._solarInterpolators(baseJD);

    const subuh = this._refineByAngle(
      this.PRAYER_PARAMS.subuh,
      latitude,
      longitude,
      offsetHours,
      interp,
      false,
    );
    const syuruk = this._refineByAngle(0.833, latitude, longitude, offsetHours, interp, false);
    const zohor = this._refineTransit(longitude, offsetHours, interp);
    const asar = this._refineAsar(latitude, longitude, offsetHours, interp);
    const maghrib = this._refineByAngle(0.833, latitude, longitude, offsetHours, interp, true);
    const isyak = this._refineByAngle(
      this.PRAYER_PARAMS.isyak,
      latitude,
      longitude,
      offsetHours,
      interp,
      true,
    );
    const imsak = subuh === null ? null : subuh + this.PRAYER_PARAMS.imsakOffset / 60;

    const raw: Record<keyof Omit<PrayerTime, "date">, number | null> = {
      imsak,
      subuh,
      syuruk,
      zohor,
      asar,
      maghrib,
      isyak,
    };

    if (useJakimAdjustments) {
      const keys = ["imsak", "subuh", "syuruk", "zohor", "asar", "maghrib", "isyak"] as const;
      for (const key of keys) {
        const value = raw[key];
        if (value !== null) raw[key] = value + this.JAKIM_ADJUSTMENTS[key] / 60;
      }
    }

    const fmt = (v: number | null) => this.formatTimeWithLuxon(v, _date) ?? "";

    return {
      date: _date.toISO() ?? "",
      imsak: fmt(raw.imsak),
      subuh: fmt(raw.subuh),
      syuruk: fmt(raw.syuruk),
      zohor: fmt(raw.zohor),
      asar: fmt(raw.asar),
      maghrib: fmt(raw.maghrib),
      isyak: fmt(raw.isyak),
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
