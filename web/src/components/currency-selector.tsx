import { Button, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import { PopoverStyle } from "./base/style";

function getCurrencyList() {
  const currencies = Intl.supportedValuesOf("currency");
  const currencyDisplayNames = new Intl.DisplayNames("en", {
    type: "currency",
  });

  const currencyList = currencies
    .map((currencyCode) => {
      return {
        currency: currencyCode,
        currencyName: currencyDisplayNames.of(currencyCode),
      };
    })
    .filter((item) => item.currencyName !== undefined);

  return currencyList;
}

export function CurrencySelector() {
  const currencies = getCurrencyList();

  return (
    <Select>
      <Button className="outline-none w-sm border-2 bg-card-background border-card-border rounded h-[50px]">
        <SelectValue></SelectValue>
      </Button>
      <Popover className={PopoverStyle}>
        <ListBox>
          {currencies.map((row) => (
            <ListBoxItem key={row.currency} id={row.currency}>
              {row.currencyName}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
