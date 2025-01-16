import { DateTime } from "luxon";

export function StatusBar() {
  const currentDate = DateTime.now();

  const formatted = currentDate.toLocaleString(DateTime.DATE_HUGE);

  return (
    <div className="text-white">
      <div>{formatted}</div>
    </div>
  );
}
