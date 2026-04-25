import { DateTime } from "luxon";

export function StatusBar() {
  const currentDate = DateTime.now();
  const formatted = currentDate.toLocaleString({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-center font-display italic text-base text-ink-quiet">{formatted}</div>
  );
}
