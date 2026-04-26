import {
  Button as AriaButton,
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover as AriaPopover,
} from "react-aria-components";
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
  onAction: (key: string) => void;
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

export function InlinePicker({
  trigger,
  ariaLabel,
  header,
  items,
  selectedKey,
  onAction,
  className,
}: InlinePickerProps) {
  return (
    <MenuTrigger>
      <AriaButton className={cs(triggerStyle, className)}>{trigger}</AriaButton>
      <AriaPopover className={popoverStyle} placement="bottom start" offset={8}>
        {header !== undefined && <AriaHeader className={headerStyle}>{header}</AriaHeader>}
        <AriaMenu
          aria-label={ariaLabel}
          className={menuStyle}
          onAction={(key) => {
            onAction(String(key));
          }}
        >
          {items.map((item) => {
            const isCurrent =
              selectedKey !== null && selectedKey !== undefined && item.key === selectedKey;
            return (
              <AriaMenuItem
                key={item.key}
                id={item.key}
                textValue={item.label}
                className={({ isHovered, isFocused }) =>
                  cs(
                    "block w-full text-left px-2 py-1 transition-colors cursor-pointer outline-none",
                    "font-body text-sm",
                    "border-l-2",
                    isCurrent
                      ? "text-accent border-accent pl-1.5"
                      : cs(
                          "border-transparent",
                          isHovered || isFocused ? "text-ink bg-paper-deep" : "text-ink-quiet",
                        ),
                  )
                }
              >
                {item.label}
              </AriaMenuItem>
            );
          })}
        </AriaMenu>
      </AriaPopover>
    </MenuTrigger>
  );
}
