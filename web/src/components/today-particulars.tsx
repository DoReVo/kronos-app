import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { latlongAtom } from "../atoms";
import { useTodaySun } from "../hooks/use-today-sun";

function fmtSun(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString({
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtCoord(deg: number, axis: "lat" | "lon"): string {
  const positive = deg >= 0;
  const dir = axis === "lat" ? (positive ? "N" : "S") : positive ? "E" : "W";
  return `${Math.abs(deg).toFixed(2)}° ${dir}`;
}

export function TodayParticulars() {
  const latlong = useAtomValue(latlongAtom);
  const { data: sunData } = useTodaySun();

  const now = DateTime.now();
  const dayOfWeek = now.toLocaleString({ weekday: "long" });
  const gregorian = now.toLocaleString({ day: "numeric", month: "long", year: "numeric" });
  const hijri = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now.toJSDate());

  const hasLocation = latlong[0] !== null && latlong[1] !== null;
  const sunrise = sunData?.syuruk;
  const sunset = sunData?.maghrib;

  let dayLength: { hours: number; minutes: number } | null = null;
  if (sunrise !== undefined && sunset !== undefined) {
    const diff = DateTime.fromISO(sunset)
      .diff(DateTime.fromISO(sunrise), ["hours", "minutes"])
      .toObject();
    dayLength = {
      hours: Math.floor(diff.hours ?? 0),
      minutes: Math.floor(diff.minutes ?? 0),
    };
  }

  return (
    <div className="text-center mx-auto w-full max-w-2xl mb-12 sm:mb-16">
      <div className="font-mono text-[0.7rem] tabular text-ink-quiet tracking-[0.2em] uppercase">
        <span>{dayOfWeek}</span>
        <span aria-hidden="true" className="text-ink-faint mx-3">
          ·
        </span>
        <span>{hijri}</span>
        <span aria-hidden="true" className="text-ink-faint mx-3">
          ·
        </span>
        <span>{gregorian}</span>
      </div>

      {hasLocation && sunrise !== undefined && sunset !== undefined && (
        <div className="font-mono text-[0.7rem] tabular text-ink-mute tracking-[0.2em] uppercase mt-3">
          <span aria-hidden="true">↑</span>
          <span className="ml-2">{fmtSun(sunrise)}</span>
          <span aria-hidden="true" className="text-ink-faint mx-3">
            ·
          </span>
          <span aria-hidden="true">↓</span>
          <span className="ml-2">{fmtSun(sunset)}</span>
          {dayLength !== null && (
            <>
              <span aria-hidden="true" className="text-ink-faint mx-3">
                ·
              </span>
              <span>
                {dayLength.hours} h {dayLength.minutes} m
              </span>
            </>
          )}
        </div>
      )}

      {hasLocation && (
        <div className="font-mono text-[0.7rem] tabular text-ink-faint tracking-[0.2em] uppercase mt-2">
          <span>{fmtCoord(latlong[0] ?? 0, "lat")}</span>
          <span aria-hidden="true" className="mx-3">
            ·
          </span>
          <span>{fmtCoord(latlong[1] ?? 0, "lon")}</span>
        </div>
      )}

      {!hasLocation && (
        <div className="font-display italic text-sm text-ink-mute mt-3">across the meridians</div>
      )}
    </div>
  );
}
