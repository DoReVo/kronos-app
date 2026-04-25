import { useMemo } from "react";
import type { Key } from "react-aria";
import { ComboBox } from "./base/combo-box";

interface Props {
  label: string;
  selectedCurrency: string;
  onCurrencyChange: (code: string) => void;
  currencies: string[];
}

interface Item {
  code: string;
  name: string;
  label: string;
}

export function CurrencySelector({ label, selectedCurrency, onCurrencyChange, currencies }: Props) {
  const items = useMemo<Item[]>(() => {
    const displayNames = new Intl.DisplayNames(undefined, { type: "currency" });
    return currencies.toSorted().map((code) => {
      const name = displayNames.of(code);
      return {
        code,
        name: name ?? code,
        label: name === undefined ? code : `${code} — ${name}`,
      };
    });
  }, [currencies]);

  const onChange = (key: Key | null) => {
    if (typeof key === "string" && key !== "") onCurrencyChange(key);
  };

  return (
    <ComboBox
      aria-label={label}
      placeholder="Search currency…"
      value={selectedCurrency}
      onChange={onChange}
      defaultItems={items}
    >
      {(item) => (
        <ComboBox.Item id={item.code} textValue={item.label}>
          <span className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-wider text-ink shrink-0 w-10">
              {item.code}
            </span>
            <span className="font-display italic text-sm text-ink-quiet truncate">{item.name}</span>
          </span>
        </ComboBox.Item>
      )}
    </ComboBox>
  );
}
