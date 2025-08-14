import cs from "clsx";

export const FocusRingStyle = cs(["outline outline-blue-600 outline-offset-2"]);

export const PopoverStyle = cs([
  "h-60 w-[var(--trigger-width)] overflow-auto",
  "text-base",
  "bg-white",
  "shadow",
]);

export const ListBoxHeader = cs(["px-2 text-lg font-bold text-card-text"]);
