import type { Zone } from "@kronos/common";
import { atom } from "jotai";

export const methodAtom = atom<"auto" | "manual">("auto");
export const latlongAtom = atom<[number | null, number | null]>([null, null]);
export const zoneAtom = atom<Zone | null>(null);
