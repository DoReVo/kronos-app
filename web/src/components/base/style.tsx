import cs from "clsx";

export const FocusRingStyle = cs([
  "outline outline-1 outline-accent outline-offset-4 rounded-none",
]);

export const PopoverStyle = cs([
  "max-h-72 w-[var(--trigger-width)] overflow-auto",
  "bg-paper border border-ink-faint",
  "shadow-[0_8px_24px_-12px_rgba(26,22,18,0.18)]",
  "rounded-none",
  "py-1",
]);

export const ListBoxHeader = cs([
  "kicker px-3 pt-3 pb-1",
  "text-ink-mute",
  "border-b border-rule-soft",
]);
