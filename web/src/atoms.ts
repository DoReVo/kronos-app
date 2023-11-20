import { atom } from "jotai";

export const methodAtom = atom<"auto" | "manual">("auto");
export const latlongAtom = atom<[number | null, number | null]>([null, null]);
