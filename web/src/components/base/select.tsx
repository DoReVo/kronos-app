import type {
  ListBoxItemProps,
  SelectProps,
  ValidationResult,
} from "react-aria-components";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { FieldError, Text } from "react-aria-components";

interface MySelectProps<T extends object>
  extends Omit<SelectProps<T>, "children"> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  items?: Iterable<T>;
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function MySelect<T extends object>({
  label,
  description,
  errorMessage,
  children,
  items,
  ...props
}: MySelectProps<T>) {
  if (!items) throw new Error("Item was not given");

  return (
    <Select {...props} className="">
      <Label>{label}</Label>
      <Button className="bg-purple-500 text-white px-4 py-2 rounded w-30 text-center">
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      {description && <Text slot="description">{description}</Text>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="">
        <ListBox className="bg-slate-100 text-purple rounded w-[--trigger-width]">
          {children}
        </ListBox>
      </Popover>
    </Select>
  );
}

export function MyItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="data-[focused=true]:outline-none py-2 px-4 data-[hovered=true]:bg-purple data-[hovered=true]:text-white data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
    />
  );
}
