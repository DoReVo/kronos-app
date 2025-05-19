import type { Zone } from "@kronos/common";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { get, set, del } from "idb-keyval";

const storage = createJSONStorage<any>(() => ({
  getItem: async (key) => {
    const value = await get(key);
    return value === undefined ? null : value;
  },
  setItem: async (key, value) => {
    await set(key, value);
  },
  removeItem: async (key) => {
    await del(key);
  },
}));

export const methodAtom = atomWithStorage<"auto" | "manual">(
  "kronos_method",
  "auto",
  storage,
);
export const latlongAtom = atomWithStorage<[number | null, number | null]>(
  "kronos_latlong",
  [null, null],
  storage,
);

export const zoneAtom = atomWithStorage<Zone | null>(
  "kronos_zone",
  null,
  storage,
);
