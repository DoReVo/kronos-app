import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Button } from "react-aria-components";
import { DateTime } from "luxon";
import QueryClientProvider from "../../query/query-provider";
import { currencyFromAtom, currencyToAtom } from "../../atoms";
import { useCurrencyRates } from "../../hooks/use-currency-rates";
import { CurrencyInput } from "../currency-input";
import { CurrencySelector } from "../currency-selector";
import { FolioMark, PageItem, RunningHead } from "../page-frame";
import { Loading } from "../base/loading";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "MYR";
const FOLIO = "04";

function PageContent() {
  const { data: rates, isLoading } = useCurrencyRates();
  const [from, setFrom] = useAtom(currencyFromAtom);
  const [to, setTo] = useAtom(currencyToAtom);
  const [amount, setAmount] = useState<number | undefined>(1);
  const [activeSide, setActiveSide] = useState<"from" | "to">("from");

  const fromAvailable = rates?.rates[from] !== undefined;
  const toAvailable = rates?.rates[to] !== undefined;

  useEffect(() => {
    if (rates !== undefined && !fromAvailable) void setFrom(DEFAULT_FROM);
  }, [rates, fromAvailable, setFrom]);

  useEffect(() => {
    if (rates !== undefined && !toAvailable) void setTo(DEFAULT_TO);
  }, [rates, toAvailable, setTo]);

  if (isLoading || rates === undefined) {
    return (
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
        <RunningHead section="Currency" folio={FOLIO} />
        <PageItem className="flex justify-center pt-20">
          <Loading>fetching rates</Loading>
        </PageItem>
      </div>
    );
  }

  const effectiveFrom = fromAvailable ? from : DEFAULT_FROM;
  const effectiveTo = toAvailable ? to : DEFAULT_TO;
  const fromRate = rates.rates[effectiveFrom];
  const toRate = rates.rates[effectiveTo];

  if (fromRate === undefined || toRate === undefined) {
    return (
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
        <RunningHead section="Currency" folio={FOLIO} />
        <PageItem className="flex justify-center pt-20">
          <Loading>fetching rates</Loading>
        </PageItem>
      </div>
    );
  }

  const rate = toRate / fromRate;
  const fromValue =
    amount === undefined ? undefined : activeSide === "from" ? amount : amount / rate;
  const toValue = amount === undefined ? undefined : activeSide === "to" ? amount : amount * rate;

  const currencies = Object.keys(rates.rates);

  const onFromAmountChange = (v: number | undefined) => {
    setAmount(v);
    setActiveSide("from");
  };
  const onToAmountChange = (v: number | undefined) => {
    setAmount(v);
    setActiveSide("to");
  };
  const onSwap = () => {
    void setFrom(effectiveTo);
    void setTo(effectiveFrom);
    setActiveSide(activeSide === "from" ? "to" : "from");
  };

  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });
  const relative = DateTime.fromISO(rates.fetchedAt).toRelative();

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
      <RunningHead section="Currency" folio={FOLIO} />

      <PageItem className="text-center">
        <div className="kicker text-ink-mute">Currency Exchange</div>
        <div className="font-display italic text-xl text-ink-quiet mt-2 max-w-[40ch] mx-auto">
          A daily reckoning of the world&rsquo;s money against itself.
        </div>
      </PageItem>

      <PageItem className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="kicker text-ink-mute">From</span>
          <span className="marginalia">premise</span>
        </div>
        <CurrencySelector
          label="From currency"
          selectedCurrency={effectiveFrom}
          onCurrencyChange={(code) => void setFrom(code)}
          currencies={currencies}
        />
        <CurrencyInput
          label="From amount"
          currency={effectiveFrom}
          value={fromValue}
          onValueChange={onFromAmountChange}
          variant="muted"
        />
      </PageItem>

      <PageItem>
        <Button
          aria-label="Swap currencies"
          onPress={onSwap}
          className="group w-full flex items-center gap-4 py-2 outline-none cursor-pointer"
        >
          <span className="flex-1 border-t border-rule group-hover:border-accent transition-colors" />
          <span className="kicker italic text-ink-mute group-hover:text-accent transition-colors flex items-baseline gap-1.5">
            <span className="text-ink-faint">·</span>
            <span>swap</span>
            <span className="text-ink-faint">·</span>
          </span>
          <span className="flex-1 border-t border-rule group-hover:border-accent transition-colors" />
        </Button>
      </PageItem>

      <PageItem className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="kicker text-accent">To</span>
          <span className="marginalia">result</span>
        </div>
        <CurrencySelector
          label="To currency"
          selectedCurrency={effectiveTo}
          onCurrencyChange={(code) => void setTo(code)}
          currencies={currencies}
        />
        <CurrencyInput
          label="To amount"
          currency={effectiveTo}
          value={toValue}
          onValueChange={onToAmountChange}
          variant="hero"
        />
      </PageItem>

      <PageItem className="flex flex-col gap-1 pt-2">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-ink-mute">Rate</span>
          <span className="flex-1 border-t border-dotted border-rule translate-y-[-0.3rem]" />
          <span className="font-mono tabular text-xs text-ink-quiet">
            1 {effectiveFrom} = {fmt.format(rate)} {effectiveTo}
          </span>
        </div>
        {relative !== null && (
          <div className="font-display italic text-sm text-ink-mute text-right">
            rates settled {relative}
          </div>
        )}
      </PageItem>

      <FolioMark folio={FOLIO} />
    </div>
  );
}

export function CurrencyConverter() {
  return (
    <QueryClientProvider>
      <PageContent />
    </QueryClientProvider>
  );
}
