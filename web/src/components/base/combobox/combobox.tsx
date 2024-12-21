import type { ComboBoxProps } from "@react-types/combobox";
import { useComboBoxState } from "react-stately";
import { useComboBox, useFilter, useButton } from "react-aria";
import { ListBox } from "../listbox/listbox.tsx";
import { Popover } from "../popover/popover.tsx";
import { useCallback, useRef, useState } from "react";
import cs from "clsx";
import { useResizeObserver } from "../../utils/use-resize-observer.ts";

export {
  Item as ComboBoxItem,
  Section as ComboBoxSection,
} from "react-stately";

const RootStyle = cs("uno-layer-base:flex-col", "w-full", "relative");
const InputContainerStyle = cs("");
const InputStyle = cs([
  "uno-layer-base:bg-purple-500",
  "uno-layer-base:text-white",
  "uno-layer-base:px-4",
  "uno-layer-base:py-2",
  "uno-layer-base:rounded",
  "uno-layer-base:w-70",
  "uno-layer-base:text-center",
  "uno-layer-base:data-[focus-visible=true]:outline",
  "uno-layer-base:data-[focus-visible=true]:outline-3",
  "uno-layer-base:data-[focus-visible=true]:outline-purple",
  "uno-layer-base:data-[focus-visible=true]:outline-offset-2",
  "uno-layer-base:placeholder:text-white",
]);
const ButtonStyle = cs("");

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

  let buttonRef = useRef<HTMLButtonElement>(null);
  let inputRef = useRef<HTMLInputElement>(null);
  let listBoxRef = useRef(null);
  let popoverRef = useRef(null);
  let triggerRef = useRef(null);

  let [menuWidth, setMenuWidth] = useState<string | null>(null);

  let onResize = useCallback(() => {
    if (inputRef.current) {
      let buttonRect = buttonRef.current?.getBoundingClientRect();
      let inputRect = inputRef.current.getBoundingClientRect();
      let minX = buttonRect
        ? Math.min(buttonRect.left, inputRect.left)
        : inputRect.left;
      let maxX = buttonRect
        ? Math.max(buttonRect.right, inputRect.right)
        : inputRect.right;
      setMenuWidth(maxX - minX + "px");
    }
  }, [buttonRef, inputRef, setMenuWidth]);

  useResizeObserver({
    ref: inputRef,
    onResize: onResize,
  });

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
      <div className={InputContainerStyle} ref={triggerRef}>
        <input {...inputProps} ref={inputRef} className={InputStyle} />
        {withButton && (
          <button {...buttonProps} ref={buttonRef} className={ButtonStyle}>
            <span>DXXX</span>
          </button>
        )}
      </div>

      <Popover
        popoverRef={popoverRef}
        triggerRef={triggerRef}
        state={state}
        isNonModal
        placement="bottom start"
        menuWidth={menuWidth}
      >
        <ListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
      </Popover>
    </div>
  );
}
