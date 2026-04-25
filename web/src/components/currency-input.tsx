import { useMemo } from "react";
import { useLocale } from "react-aria";
import { Input, NumberField } from "react-aria-components";
import cs from "clsx";

interface Props {
  label: string;
  currency: string;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  variant?: "hero" | "muted";
}

export function CurrencyInput({ label, currency, value, onValueChange, variant = "muted" }: Props) {
  const { locale } = useLocale();

  const formatOptions = useMemo<Intl.NumberFormatOptions>(() => {
    const fractionDigits = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return {
      style: "decimal",
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
      useGrouping: true,
    };
  }, [currency, locale]);

  return (
    <NumberField
      aria-label={label}
      value={value ?? Number.NaN}
      onChange={(v) => {
        onValueChange(Number.isNaN(v) ? undefined : v);
      }}
      minValue={0}
      formatOptions={formatOptions}
      className="block w-full"
    >
      <Input
        className={cs(
          "block w-full bg-transparent text-ink",
          "border-0 border-b border-rule outline-none tabular",
          "transition-colors",
          "focus:border-accent focus:border-b-2",
          "px-0",
          variant === "hero"
            ? cs(
                "font-display italic font-normal",
                "text-[clamp(3.75rem,15vw,7.5rem)] leading-[0.95]",
                "py-3",
                "tracking-tight",
              )
            : cs("font-display text-3xl leading-tight py-2"),
        )}
      />
    </NumberField>
  );
}
