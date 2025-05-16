import type {
  ComboBoxProps,
  ListBoxItemProps,
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
} from "react-aria-components";

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
    <AriaComboBox {...props}>
      <AriaLabel>{label}</AriaLabel>
      <div className="my-combobox-container">
        <AriaInput />
        <AriaButton>▼</AriaButton>
      </div>
      {description && <AriaText slot="description">{description}</AriaText>}
      <AriaFieldError>{errorMessage}</AriaFieldError>
      <AriaPopover>
        <AriaListBox>{children}</AriaListBox>
      </AriaPopover>
    </AriaComboBox>
  );
}

function Item(props: ListBoxItemProps) {
  return (
    <AriaListBoxItem
      {...props}
      className={({ isFocused, isSelected }) =>
        `my-item ${isFocused ? "focused" : ""} ${isSelected ? "selected" : ""}`
      }
    />
  );
}

ComboBox.Item = Item;
