import cs from "clsx";
import { useAtom } from "jotai";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { methodAtom } from "../atoms";

const RadioStyle = cs(["group cursor-pointer outline-none", "flex flex-col gap-1", "py-2 flex-1"]);

const RadioTitleStyle = cs([
  "kicker transition-colors",
  "group-data-[selected]:text-accent",
  "text-ink-mute",
  "pb-1",
  "border-b border-transparent",
  "group-data-[selected]:border-accent",
]);

const LabelStyle = cs([
  "font-display italic text-sm text-ink-quiet leading-snug",
  "group-data-[selected]:text-ink",
]);

export function MethodToggle() {
  const [method, setMethod] = useAtom(methodAtom);

  const onChangeHandler = (value: string) => {
    if (value !== "manual" && value !== "auto") return;
    void setMethod(value);
  };

  return (
    <RadioGroup
      className="flex flex-row items-stretch gap-8"
      value={method}
      onChange={onChangeHandler}
      aria-label="Method"
    >
      <Radio value="auto" className={RadioStyle}>
        <span className={RadioTitleStyle}>Auto</span>
        <Label className={LabelStyle}>Times derived from your current location</Label>
      </Radio>
      <Radio value="manual" className={RadioStyle}>
        <span className={RadioTitleStyle}>Manual</span>
        <Label className={LabelStyle}>You choose your JAKIM zone</Label>
      </Radio>
    </RadioGroup>
  );
}
