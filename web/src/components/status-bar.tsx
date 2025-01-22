import { DateTime } from "luxon";

export function StatusBar() {
  const currentDate = DateTime.now();

  const formatted = currentDate.toLocaleString(DateTime.DATE_HUGE);
  const locale = navigator.language;

  return (
    <div className="text-white text-center">
      <div>{formatted}</div>
      <div>{locale}</div>
    </div>
  );
}
