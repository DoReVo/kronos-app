import cs from "clsx";

export const FocusRingStyle = cs(["outline outline-blue-600 outline-offset-2"]);

export const PopoverStyle = cs([
  "uno-layer-base:(h-60 w-[var(--trigger-width)] overflow-auto)",
  "uno-layer-base:(rounded-sm bg-canvas-light)",
  "uno-layer-base:(ring-1 ring-black/5)",
  "uno-layer-base:(text-base text-white)",
  "uno-layer-base:(p-2)",
]);

export const ListBoxHeader = cs(["text-lg font-bold text-gray-500"]);
