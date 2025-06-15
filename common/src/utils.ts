import { DateTime } from "luxon";

export function isoToCommonDateTime(dateTime: string) {
  const result = DateTime.fromISO(dateTime).toUTC();

  if (result.isValid) {
    return result;
  } else return null;
}

export function dateTimeToCommonDay(dateTime: DateTime<true>) {
  return dateTime.startOf("day");
}
