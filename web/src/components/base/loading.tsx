import cs from "clsx";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export function Loading({ children = "loading", className }: Props) {
  return (
    <div className={cs("kicker italic text-ink-mute select-none", className)}>
      <span className="text-ink-faint mr-2">·</span>
      {children}
      <span className="text-ink-faint ml-2">·</span>
    </div>
  );
}
