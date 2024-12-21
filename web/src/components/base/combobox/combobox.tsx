import type { ComboBoxProps } from "@react-types/combobox";
import { useComboBoxState } from "react-stately";
import { useComboBox, useFilter, useButton } from "react-aria";
import { ListBox } from "../listbox/listbox.tsx";
import { Popover } from "../popover/popover.tsx";
import { useRef } from "react";
import { clsx } from "clsx";

export { Item, Section } from "react-stately";

const RootStyle = clsx("flex-col", "w-full", "relative");
const InputContainerStyle = clsx("");

export interface Props<T extends object> extends ComboBoxProps<T> {
  withButton?: boolean;
}

export function ComboBox<T extends object>(props: Props<T>) {
  const propsWithDefaults = {
    ...props,
  };
  const { withButton } = propsWithDefaults;
  let { contains } = useFilter({ sensitivity: "base" });
  let state = useComboBoxState({ ...props, defaultFilter: contains });

  let buttonRef = useRef(null);
  let inputRef = useRef(null);
  let listBoxRef = useRef(null);
  let popoverRef = useRef(null);

  let {
    buttonProps: triggerProps,
    inputProps,
    listBoxProps,
  } = useComboBox(
    {
      ...props,
      inputRef,
      buttonRef,
      listBoxRef,
      popoverRef,
    },
    state,
  );

  let { buttonProps } = useButton(triggerProps, buttonRef);

  return (
    <div className={RootStyle}>
      <div className={InputContainerStyle}>
        <input
          {...inputProps}
          ref={inputRef}
          className="outline-none px-3 py-1 w-full"
        />
        {withButton && (
          <button
            {...buttonProps}
            ref={buttonRef}
            className={`px-1 bg-gray-100 cursor-default border-l-2 ${
              state.isFocused
                ? "border-pink-500 text-pink-600"
                : "border-gray-300 text-gray-500"
            }`}
          >
            <span>D</span>
          </button>
        )}
      </div>
      {state.isOpen && (
        <Popover
          popoverRef={popoverRef}
          triggerRef={inputRef}
          state={state}
          isNonModal
          placement="bottom start"
          className="w-52"
        >
          <ListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
        </Popover>
      )}
    </div>
  );
}
