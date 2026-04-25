import React from "react";
import cs from "clsx";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";

export interface SwitchProps extends Omit<AriaSwitchProps, "children"> {
  children: React.ReactNode;
  offLabel?: string;
  onLabel?: string;
}

export function Switch({ children, offLabel = "off", onLabel = "on", ...props }: SwitchProps) {
  return (
    <AriaSwitch
      {...props}
      className="group inline-flex items-baseline gap-3 cursor-pointer outline-none"
    >
      {({ isSelected }) => (
        <>
          <span className="font-body text-sm text-ink">{children}</span>
          <span className="kicker inline-flex items-baseline gap-1.5 select-none">
            <span
              className={cs(
                "transition-colors",
                isSelected ? "text-ink-mute" : "text-accent border-b border-accent pb-px",
              )}
            >
              {offLabel}
            </span>
            <span className="text-ink-faint">·</span>
            <span
              className={cs(
                "transition-colors",
                isSelected ? "text-accent border-b border-accent pb-px" : "text-ink-mute",
              )}
            >
              {onLabel}
            </span>
          </span>
        </>
      )}
    </AriaSwitch>
  );
}
