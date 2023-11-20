import { PrayerTime } from "@kronos/common";
import Joi from "joi";
import { DateTime } from "luxon";

const prayerTimeItemSchema = Joi.object({
  hijri: Joi.string().required(),
  date: Joi.string().required(),
  day: Joi.string().required(),
  imsak: Joi.string().required(),
  fajr: Joi.string().required(),
  syuruk: Joi.string().required(),
  dhuhr: Joi.string().required(),
  asr: Joi.string().required(),
  maghrib: Joi.string().required(),
  isha: Joi.string().required(),
});

const schema = Joi.object({
  prayerTime: Joi.array().items(prayerTimeItemSchema).required(),
}).unknown();

const BASE_API_URL = "https://www.e-solat.gov.my/index.php";

export async function fetchTime(zone: string, day: string, KV: KVNamespace) {
  try {
    let zoneData = await KV.get(zone);

    if (!zoneData) {
      zoneData = await _fetchYearlyForZone(zone);
      // Save data
      await KV.put(zone, JSON.stringify(zoneData));
    } else {
      zoneData = JSON.parse(zoneData as any);
    }

    const entry = (zoneData as any)?.find((entry: any) => {
      return entry?.date === day;
    });

    return entry;
  } catch (error) {
    console.error(error);
  }
}

async function _fetchYearlyForZone(zone: string) {
  try {
    const url = new URL(BASE_API_URL);

    url.search = new URLSearchParams({
      r: "esolatApi/takwimsolat",
      period: "year",
      zone: zone,
    }).toString();

    let res = await fetch(url.toString(), {
      method: "GET",
    });

    res = await res.json();

    const validatedData = schema.validate(res);

    if (validatedData.error) {
      throw new Error("Invalid data from JAKIM");
    }

    const formattedData = (validatedData?.value as any)?.prayerTime?.map(
      (day: any) => {
        let dayData: {
          [K in PrayerTime["Name"]]: string;
        } & { date: string };

        dayData = {
          date: DateTime.fromFormat(day.date, "dd-MMM-yyyy").toISODate()!,
          imsak: DateTime.fromFormat(day.imsak, "TT").toFormat("t"),
          subuh: DateTime.fromFormat(day.fajr, "TT").toFormat("t"),
          syuruk: DateTime.fromFormat(day.syuruk, "TT").toFormat("t"),
          zohor: DateTime.fromFormat(day.dhuhr, "TT").toFormat("t"),
          asar: DateTime.fromFormat(day.asr, "TT").toFormat("t"),
          maghrib: DateTime.fromFormat(day.maghrib, "TT").toFormat("t"),
          isyak: DateTime.fromFormat(day.isha, "TT").toFormat("t"),
        };

        return dayData;
      },
    );

    return formattedData;
  } catch (error) {
    console.error(error);
  }
}
