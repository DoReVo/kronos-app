import React from "react";
import cs from "clsx";
import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps,
} from "react-aria-components";

export interface SwitchProps extends Omit<AriaSwitchProps, "children"> {
  children: React.ReactNode;
}

const RootSwitchStyle = cs(["w-max flex gap-2 items-center", "transition"]);

const TrackStyle = cs([
  "h-4 w-7",
  "flex px-px items-center shrink-0 cursor-default",
  "rounded-full shadow-inner border border-transparent",
  "transition duration-200 ease-in-out",
  "bg-violet-200",
  "data-[selected=true]:bg-violet-500",
]);

const HandleStyle = cs([
  "h-3 w-3",
  "rounded-full bg-white shadow-xs",
  "outline outline-1 -outline-offset-1 outline-transparent",
  "transform translate-x-0",
  "transition duration-200 ease-in-out",
  "data-[selected=true]:translate-x-[100%]",
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
