import type { AriaPopoverProps } from "@react-aria/overlays";
import { DismissButton, Overlay, usePopover } from "@react-aria/overlays";
import { useRef, type ReactNode, type RefObject } from "react";
import type { OverlayTriggerState } from "react-stately";
import type { WithDefaultProps } from "../../../utils";
import cs from "clsx";

interface PopoverProps extends Omit<AriaPopoverProps, "popoverRef"> {
  children: ReactNode;
  state: OverlayTriggerState;
  className?: string;
  popoverRef?: RefObject<HTMLDivElement | null>;
}

const UnderlayStyle = cs("fixed", "inset-0");
const PopoverStyle = cs([
  "uno-layer-base:z-100",
  "uno-layer-base:shadow-lg",
  "uno-layer-base:border",
  "uno-layer-base:border-gray-300",
  "uno-layer-base:bg-white",
  "uno-layer-base:rounded-md",
  "uno-layer-base:mt-2",
]);

export function Popover(props: PopoverProps) {
  let ref = useRef<HTMLDivElement>(null);

  const propsWithDefaults: WithDefaultProps<PopoverProps, "popoverRef"> = {
    ...props,
    popoverRef: props.popoverRef ?? ref,
  };

  let { popoverRef, state, children, isNonModal } = propsWithDefaults;

  let { popoverProps, underlayProps } = usePopover(
    {
      ...props,
      popoverRef,
    },
    state,
  );

  return (
    <Overlay>
      {!isNonModal && <div {...underlayProps} className={UnderlayStyle} />}
      <div {...popoverProps} ref={popoverRef} className={PopoverStyle}>
        {!isNonModal && <DismissButton onDismiss={state.close} />}
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
}
