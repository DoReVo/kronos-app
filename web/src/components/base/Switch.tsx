import React from "react";
import cs from "clsx";
import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps,
} from "react-aria-components";

export interface SwitchProps extends Omit<AriaSwitchProps, "children"> {
  children: React.ReactNode;
}

const RootSwitchStyle = cs([
  "uno-layer-base:(w-max flex gap-2 items-center)",
  "uno-layer-base:(text-white)",
  "uno-layer-base:(transition)",
]);

const TrackStyle = cs([
  "uno-layer-base:(h-4 w-7)",
  "uno-layer-base:(flex px-px items-center shrink-0 cursor-default)",
  "uno-layer-base:(rounded-full shadow-inner border border-transparent)",
  "uno-layer-base:(transition duration-200 ease-in-out)",
  "uno-layer-base:(bg-gray-400)",
  "uno-layer-base:(data-[selected=true]:bg-brand)",
]);

const HandleStyle = cs([
  "uno-layer-base:(h-3 w-3 )",
  "uno-layer-base:(rounded-full bg-white shadow-xs)",
  "uno-layer-base:(outline outline-1 -outline-offset-1 outline-transparent)",
  "uno-layer-base:(transform translate-x-0)",
  "uno-layer-base:(transition duration-200 ease-in-out)",
  "uno-layer-base:(data-[selected=true]:translate-x-100%)",
]);

export function Switch({ children, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={RootSwitchStyle}>
      {({ isSelected, isDisabled }) => (
        <>
          {children}
          <div
            className={TrackStyle}
            data-selected={isSelected}
            data-disabled={isDisabled}
          >
            <span
              className={HandleStyle}
              data-selected={isSelected}
              data-disabled={isDisabled}
            />
          </div>
        </>
      )}
    </AriaSwitch>
  );
}
