import type { PrayerTime } from "@kronos/common";
import cs from "clsx";

const RootStyle = cs([
  "flex",
  "w-full max-w-xl",
  "items-center justify-between",
  "rounded",
  "bg-card-background",
  "text-text",
  "p-4 text-2xl",
]);

export function TimeCard(props: PrayerTime) {
  return (
    <div className={RootStyle}>
      <div>{props.Name.toUpperCase()}</div>
      <div>{props.Time}</div>
    </div>
  );
}
