import type { Zone } from "@kronos/common";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { get, set, del } from "idb-keyval";

function makeStorage<T>() {
  return createJSONStorage<T>(() => ({
    getItem: async (key): Promise<string | null> => {
      const value = await get<string>(key);
      return value ?? null;
    },
    setItem: async (key, value): Promise<void> => {
      await set(key, value);
    },
    removeItem: async (key): Promise<void> => {
      await del(key);
    },
  }));
}

export const methodAtom = atomWithStorage<"auto" | "manual">(
  "kronos_method",
  "auto",
  makeStorage<"auto" | "manual">(),
);

export const latlongAtom = atomWithStorage<[number | null, number | null]>(
  "kronos_latlong",
  [null, null],
  makeStorage<[number | null, number | null]>(),
);

export const zoneAtom = atomWithStorage<Zone | null>(
  "kronos_zone",
  null,
  makeStorage<Zone | null>(),
);

export const currencyFromAtom = atomWithStorage<string>(
  "kronos_currency_from",
  "USD",
  makeStorage<string>(),
);

export const currencyToAtom = atomWithStorage<string>(
  "kronos_currency_to",
  "MYR",
  makeStorage<string>(),
);

export const pandemicStateAtom = atomWithStorage<string>(
  "kronos_pandemic_state",
  "Malaysia",
  makeStorage<string>(),
);

export const pandemicCompareAtom = atomWithStorage<string | null>(
  "kronos_pandemic_compare",
  null,
  makeStorage<string | null>(),
);

export const pandemicYearAtom = atomWithStorage<string>(
  "kronos_pandemic_year",
  "all",
  makeStorage<string>(),
);
