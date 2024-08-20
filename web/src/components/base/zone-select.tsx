import type { ComponentProps } from "react";
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
  Select as RASelect,
  SelectValue,
  Header,
  Section,
  FieldError,
  Text,
} from "react-aria-components";

interface MySelectProps<T extends object>
  extends Omit<SelectProps<T>, "children"> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  children: React.ReactNode | ((item: T) => React.ReactNode);
  items: Iterable<T>;
}

export function Select<T extends object>({
  label,
  description,
  errorMessage,
  children,
  items,
  ...props
}: MySelectProps<T>) {
  if (!items) throw new Error("Items must be given");

  return (
    <RASelect {...props} className="">
      <Label>{label}</Label>
      <Button className="bg-purple-500 text-white px-4 py-2 rounded w-70 text-center">
        <SelectValue />
      </Button>
      {description && <Text slot="description">{description}</Text>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="">
        <ListBox className="max-h-xs overflow-auto bg-slate-100 text-purple rounded w-[--trigger-width]">
          {children}
        </ListBox>
      </Popover>
    </RASelect>
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className="data-[focused=true]:outline-none py-1 px-4 data-[hovered=true]:bg-purple data-[hovered=true]:text-white data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
    />
  );
}

export function SelectHeader(props: ComponentProps<typeof Header>) {
  return <Header className="py-1 px-4 font-bold">{props.children}</Header>;
}

export function SelectSection(props: ComponentProps<typeof Section>) {
  return <Section>{props.children}</Section>;
}
