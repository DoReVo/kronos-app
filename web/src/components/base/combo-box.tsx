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
  Button as AriaButton,
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
  description?: string | null;
  errorMessage?: string | ((validation: ValidationResult) => string);
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  ...props
}: Props<T>) {
  return (
    <AriaComboBox {...props} menuTrigger="focus">
      <AriaLabel>{label}</AriaLabel>
      <div className="">
        <AriaInput
          className="p-2 border text-card-text border-card-border outline-none rounded"
          placeholder="Choose a zone"
        />
        <AriaButton></AriaButton>
      </div>
      {description && <AriaText slot="description">{description}</AriaText>}
      <AriaFieldError>{errorMessage}</AriaFieldError>
      <AriaPopover className={PopoverStyle}>
        <AriaListBox className="text-card-text flex flex-col gap-2">
          {children}
        </AriaListBox>
      </AriaPopover>
    </AriaComboBox>
  );
}

function Item(props: ListBoxItemProps) {
  return (
    <AriaListBoxItem
      className={({ isSelected, isHovered, isFocused }) =>
        cs(
          {
            "bg-card-background": isSelected,
            "bg-card-background-selected": isHovered || isFocused,
          },
          "px-2 py-1",
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
    <ListBoxSection {..._props} className="flex flex-col gap-2">
      <Header className={ListBoxHeader}>{title}</Header>
      {!!items && <Collection items={items}>{children}</Collection>}
    </ListBoxSection>
  );
}

ComboBox.Item = Item;
ComboBox.Section = Section;
