import cs from "clsx";

interface Props {
  name: string;
  time: string;
  isPast?: boolean;
}

export function TimeCard({ name, time, isPast = false }: Props) {
  return (
    <div
      className={cs(
        "flex items-baseline justify-between w-full",
        "py-3",
        "border-t border-rule-soft",
        "transition-colors",
      )}
    >
      <span className={cs("kicker", isPast ? "text-ink-faint" : "text-ink-quiet")}>{name}</span>
      <span
        className={cs(
          "font-display tabular text-2xl",
          isPast ? "text-ink-faint line-through decoration-rule" : "text-ink",
        )}
      >
        {time}
      </span>
    </div>
  );
}
