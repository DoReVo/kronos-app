import {
  Button as AriaButton,
  Popover as AriaPopover,
  Dialog as AriaDialog,
  DialogTrigger,
} from "react-aria-components";
import type { ReactNode } from "react";
import cs from "clsx";

interface InlinePickerProps {
  label: string;
  className?: string;
  children: (close: () => void) => ReactNode;
}

const triggerBase = cs([
  "font-display italic",
  "border-b border-dotted border-rule",
  "transition-colors",
  "outline-none cursor-pointer",
  "text-ink hover:text-accent hover:border-accent",
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-2",
]);

const popoverStyle = cs([
  "min-w-[14rem] max-w-[24rem] max-h-72 overflow-auto",
  "bg-paper border border-ink-faint",
  "shadow-[0_8px_24px_-12px_rgba(26,22,18,0.18)]",
  "rounded-none",
  "px-3 py-3",
]);

export function InlinePicker({ label, className, children }: InlinePickerProps) {
  return (
    <DialogTrigger>
      <AriaButton className={cs(triggerBase, className)}>{label}</AriaButton>
      <AriaPopover className={popoverStyle} placement="bottom start" offset={8}>
        <AriaDialog className="outline-none">{({ close }) => children(close)}</AriaDialog>
      </AriaPopover>
    </DialogTrigger>
  );
}

interface PickerListItemProps {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
}

export function PickerListItem({ selected, onPress, children }: PickerListItemProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cs(
        "block w-full text-left px-2 py-1 transition-colors cursor-pointer outline-none",
        "font-body text-sm",
        selected
          ? "text-accent border-l-2 border-accent pl-1.5"
          : "text-ink-quiet hover:text-ink hover:bg-paper-deep border-l-2 border-transparent",
      )}
    >
      {children}
    </button>
  );
}
