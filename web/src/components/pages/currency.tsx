import QueryClientProvider from "../../query/query-provider";
import { CurrencyInput } from "../currency-input";
import { CurrencySelector } from "../currency-selector";

function PageContent() {
  return (
    <div className="flex-[1_0_0] flex self-center flex-col">
      <div className="flex gap-4 items-start justify-start">
        <span>From</span>
        <CurrencySelector />
        <CurrencySelector />
      </div>
      <div className="flex gap-4 items-start justify-start">
        <h1>HELLOW</h1>
        <CurrencyInput currency="USD" />
      </div>
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
