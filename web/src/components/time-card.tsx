import type { PrayerTime } from "@kronos/common";

export function TimeCard(props: PrayerTime) {
  return (
    <div className="flex w-full max-w-xl items-center justify-between rounded bg-main-primary p-4 text-2xl">
      <div>{props.Name.toUpperCase()}</div>
      <div>{props.Time}</div>
    </div>
  );
}
