import type {
  ComboBoxProps,
  ListBoxItemProps,
  ListBoxSectionProps,
  ValidationResult,
} from "react-aria-components";
import {
  ComboBox as AriaComboBox,
  Label as AriaLabel,
  FieldError as AriaFieldError,
  Text as AriaText,
  Input as AriaInput,
  Popover as AriaPopover,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection,
  Header,
  Collection,
} from "react-aria-components";
import { ListBoxHeader, PopoverStyle } from "./style";
import cs from "clsx";

interface Props<T extends object> extends Omit<ComboBoxProps<T>, "children"> {
  label?: string;
  placeholder?: string;
  description?: string | null;
  errorMessage?: string | ((validation: ValidationResult) => string);
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function ComboBox<T extends object>({
  label,
  placeholder = "Search…",
  description,
  errorMessage,
  children,
  ...props
}: Props<T>) {
  return (
    <AriaComboBox {...props} menuTrigger="focus" className="flex flex-col gap-1">
      {label !== undefined && <AriaLabel className="kicker">{label}</AriaLabel>}
      <div className="relative">
        <AriaInput
          className={cs(
            "w-full bg-transparent",
            "px-0 py-2 pr-6",
            "font-display text-lg text-ink placeholder:text-ink-mute placeholder:italic",
            "border-0 border-b border-rule",
            "outline-none focus:border-accent focus:border-b-2",
            "transition-colors",
          )}
          placeholder={placeholder}
        />
        <span
          aria-hidden="true"
          className="icon-[lucide--chevron-down] absolute right-1 top-1/2 -translate-y-1/2 text-sm text-ink-mute pointer-events-none"
        />
      </div>
      {description !== null && description !== undefined && (
        <AriaText slot="description" className="marginalia mt-1">
          {description}
        </AriaText>
      )}
      <AriaFieldError className="marginalia text-accent mt-1">{errorMessage}</AriaFieldError>
      <AriaPopover className={PopoverStyle}>
        <AriaListBox className="text-ink outline-none">{children}</AriaListBox>
      </AriaPopover>
    </AriaComboBox>
  );
}

function Item(props: ListBoxItemProps) {
  return (
    <AriaListBoxItem
      className={({ isSelected, isHovered, isFocused }) =>
        cs(
          "px-3 py-1.5 cursor-pointer outline-none",
          "font-body text-sm text-ink",
          "transition-colors",
          {
            "bg-accent-soft": isSelected,
            "bg-paper-deep": (isHovered || isFocused) && !isSelected,
          },
        )
      }
      {...props}
    />
  );
}

interface SectionProps<T extends object> extends ListBoxSectionProps<T> {
  title: string;
}

function Section<T extends object>(props: SectionProps<T>) {
  const { children, title, items, ..._props } = props;
  return (
    <ListBoxSection {..._props} className="flex flex-col">
      <Header className={ListBoxHeader}>{title}</Header>
      {!!items && <Collection items={items}>{children}</Collection>}
    </ListBoxSection>
  );
}

ComboBox.Item = Item;
ComboBox.Section = Section;
