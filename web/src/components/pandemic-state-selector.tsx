import type { Key } from "react-aria";
import { ComboBox } from "./base/combo-box";

interface Props {
  value: string | null;
  onChange: (state: string | null) => void;
  states: string[];
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export function PandemicStateSelector({
  value,
  onChange,
  states,
  label,
  placeholder = "Choose a state",
  allowClear = false,
}: Props) {
  const handleChange = (next: Key | null) => {
    if (next === null) {
      if (allowClear) onChange(null);
      return;
    }
    onChange(String(next));
  };

  return (
    <ComboBox
      {...(label === undefined ? {} : { label })}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      allowsEmptyCollection
    >
      {states.map((state) => (
        <ComboBox.Item key={state} id={state}>
          {state}
        </ComboBox.Item>
      ))}
    </ComboBox>
  );
}
