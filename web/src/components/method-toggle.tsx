import type { RadioGroupProps, ValidationResult } from "react-aria-components";
import {
  FieldError,
  Label,
  Radio,
  RadioGroup,
  RadioGroupStateContext,
  Text,
} from "react-aria-components";

import cs from "clsx";

const RootStyle = cs(["text-white", "flex flex-row items-stretch gap-4"]);

const RadioStyle = cs([
  "flex flex-col gap-2",
  "p-4 rounded flex-1",
  "data-[selected]:bg-#072030",
]);

const LabelStyle = cs(["text-sm"]);

const RadioTitleStyle = cs(["text-white text-lg"]);

export function MethodToggle(props) {
  return (
    <RadioGroup {...props} className={RootStyle}>
      <Radio value="auto" className={RadioStyle}>
        <span className={RadioTitleStyle}>Auto</span>
        <Label className={LabelStyle}>
          Time will be based on your current location
        </Label>
      </Radio>
      <Radio value="manual" className={RadioStyle}>
        <span className={RadioTitleStyle}>Manual</span>
        <Label className={LabelStyle}>You choose your own location</Label>
      </Radio>
    </RadioGroup>
  );
}
