import type { AriaPopoverProps } from "@react-aria/overlays";
import { DismissButton, Overlay, usePopover } from "@react-aria/overlays";
import {
  useRef,
  type CSSProperties,
  type PropsWithChildren,
  type RefObject,
} from "react";
import type { OverlayTriggerState } from "react-stately";
import type { WithDefaultProps } from "../../../utils";
import cs from "clsx";

interface PopoverProps
  extends Omit<AriaPopoverProps, "popoverRef">,
    PropsWithChildren {
  state: OverlayTriggerState;
  className?: string;
  popoverRef?: RefObject<HTMLDivElement | null>;
  menuWidth?: string | null;
}

const UnderlayStyle = cs("fixed", "inset-0");
const PopoverStyle = cs([
  "uno-layer-base:z-100",
  "uno-layer-base:shadow-sm",
  "uno-layer-base:bg-white",
  "uno-layer-base:rounded",
  "uno-layer-base:mt-2",
  "uno-layer-base:w-[--trigger-width]",
]);

export function Popover(props: PopoverProps) {
  let ref = useRef<HTMLDivElement>(null);

  const propsWithDefaults: WithDefaultProps<PopoverProps, "popoverRef"> = {
    ...props,
    popoverRef: props.popoverRef ?? ref,
  };

  let {
    popoverRef,
    triggerRef,
    state,
    children,
    isNonModal,
    menuWidth: width,
  } = propsWithDefaults;

  let { popoverProps, underlayProps } = usePopover(
    {
      ...props,
      popoverRef,
      triggerRef,
    },
    state,
  );

  return (
    <Overlay>
      <div style={{ "--trigger-width": width } as CSSProperties}>
        {!isNonModal && <div {...underlayProps} className={UnderlayStyle} />}
        <div {...popoverProps} ref={popoverRef} className={PopoverStyle}>
          {!isNonModal && <DismissButton onDismiss={state.close} />}
          {children}
          <DismissButton onDismiss={state.close} />
        </div>
      </div>
    </Overlay>
  );
}
