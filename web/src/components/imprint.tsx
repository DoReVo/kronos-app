import { useMemo } from "react";
import { DateTime } from "luxon";

interface ImprintProps {
  setAt?: number;
}

export function Imprint({ setAt }: ImprintProps) {
  const formatted = useMemo(() => {
    if (setAt === undefined || setAt === 0) return null;
    const dt = DateTime.fromMillis(setAt);
    return {
      time: dt.toLocaleString({ hour: "2-digit", minute: "2-digit", hour12: false }),
      date: dt.toLocaleString({ day: "numeric", month: "long" }).toLowerCase(),
    };
  }, [setAt]);

  if (formatted === null) return null;

  return (
    <div className="kicker italic text-ink-mute text-center tabular">
      <span className="text-ink-faint">·</span> set{" "}
      <span className="font-mono not-italic">{formatted.time}</span>{" "}
      <span className="text-ink-faint">·</span> {formatted.date}{" "}
      <span className="text-ink-faint">·</span>
    </div>
  );
}
