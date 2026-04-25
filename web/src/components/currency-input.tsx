import { useMemo } from "react";
import { Input, NumberField } from "react-aria-components";

interface Props {
  currency: string;
}

export function CurrencyInput({ currency }: Props) {
  const formatOptions = useMemo<Intl.NumberFormatOptions>(
    () => ({
      style: "currency",
      currency,
      currencyDisplay: "code",
      currencySign: "standard",
    }),
    [currency],
  );

  return (
    <NumberField formatOptions={formatOptions}>
      <Input className="border" />
    </NumberField>
  );
}
