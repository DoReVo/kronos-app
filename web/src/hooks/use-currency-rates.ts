import { CurrencyRatesSchema, type CurrencyRates } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { createKy } from "../api/ky";

const ky = createKy();

export function useCurrencyRates() {
  return useQuery<CurrencyRates>({
    queryKey: ["currency", "rates"],
    staleTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: 500,
    queryFn: async () => {
      const body: unknown = await ky.get("currency/rates").json();
      return CurrencyRatesSchema.parse(body);
    },
  });
}
