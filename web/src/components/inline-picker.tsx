import { useMemo } from "react";
import {
  Button as AriaButton,
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
import type { Key, Selection } from "react-aria-components";
import cs from "clsx";

export interface InlinePickerItem {
  key: string;
  label: string;
}

interface InlinePickerProps {
  trigger: string;
  ariaLabel: string;
  header?: string;
  items: InlinePickerItem[];
  selectedKey?: string | null;
  onSelect: (key: string) => void;
  className?: string;
}

const triggerStyle = cs([
  "font-display italic",
  "border-b border-dotted border-rule",
  "transition-colors",
  "outline-none cursor-pointer",
  "text-ink hover:text-accent hover:border-accent",
  "data-[focus-visible]:text-accent data-[focus-visible]:border-accent",
  "data-[pressed]:text-accent",
]);

const popoverStyle = cs([
  "min-w-[14rem] max-w-[24rem] max-h-72 overflow-auto",
  "bg-paper border border-ink-faint",
  "shadow-[0_8px_24px_-12px_rgba(26,22,18,0.18)]",
  "rounded-none",
  "px-3 py-3",
]);

const headerStyle = cs(["kicker text-ink-mute mb-2 block"]);

const menuStyle = cs(["outline-none flex flex-col"]);

const itemStyle = ({
  isHovered,
  isFocused,
  isSelected,
}: {
  isHovered: boolean;
  isFocused: boolean;
  isSelected: boolean;
}): string =>
  cs([
    "block w-full text-left px-2 py-1 transition-colors cursor-pointer outline-none",
    "font-body text-sm",
    "border-l-2",
    isSelected
      ? "text-accent border-accent pl-1.5"
      : cs([
          "border-transparent",
          isHovered || isFocused ? "text-ink bg-paper-deep" : "text-ink-quiet",
        ]),
  ]);

export function InlinePicker({
  trigger,
  ariaLabel,
  header,
  items,
  selectedKey,
  onSelect,
  className,
}: InlinePickerProps) {
  const selectedKeys = useMemo<Iterable<Key>>(
    () => (selectedKey === null || selectedKey === undefined ? [] : [selectedKey]),
    [selectedKey],
  );
  const handleChange = (keys: Selection): void => {
    if (keys === "all") return;
    const [first] = keys;
    if (typeof first === "string") onSelect(first);
  };

  return (
    <MenuTrigger>
      <AriaButton className={cs(triggerStyle, className)}>{trigger}</AriaButton>
      <AriaPopover className={popoverStyle} placement="bottom start" offset={8}>
        {header !== undefined && <AriaHeader className={headerStyle}>{header}</AriaHeader>}
        <AriaMenu
          aria-label={ariaLabel}
          className={menuStyle}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={selectedKeys}
          onSelectionChange={handleChange}
        >
          {items.map((item) => (
            <AriaMenuItem key={item.key} id={item.key} textValue={item.label} className={itemStyle}>
              {item.label}
            </AriaMenuItem>
          ))}
        </AriaMenu>
      </AriaPopover>
    </MenuTrigger>
  );
}
