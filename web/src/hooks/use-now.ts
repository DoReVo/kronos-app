import { useEffect, useState } from "react";
import { DateTime } from "luxon";

const DEFAULT_TICK_MS = 60_000;

export function useNow(intervalMs: number = DEFAULT_TICK_MS): DateTime {
  const [now, setNow] = useState<DateTime>(() => DateTime.now());
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow((prev) => {
        const next = DateTime.now();
        return prev.hasSame(next, "minute") ? prev : next;
      });
    }, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
