import cs from "clsx";
import { useAtom } from "jotai";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { methodAtom } from "../atoms";

const RootStyle = cs(["text-white", "flex flex-row items-stretch gap-4"]);

const RadioStyle = cs([
  "flex flex-col gap-2",
  "p-4 rounded flex-1",
  "bg-method-background",
  "data-[selected]:bg-method-background-selected",
]);

const LabelStyle = cs(["text-sm"]);

const RadioTitleStyle = cs(["text-white text-lg"]);

export function MethodToggle() {
  const [method, setMethod] = useAtom(methodAtom);

  const onChangeHandler = (value: string) => {
    if (value !== "manual" && value !== "auto") return;

    setMethod(value);
  };

  return (
    <RadioGroup className={RootStyle} value={method} onChange={onChangeHandler}>
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
