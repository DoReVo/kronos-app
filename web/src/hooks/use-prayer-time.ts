import { type PrayerTime } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { latlongAtom, methodAtom, zoneAtom } from "../atoms";
import { createKy } from "../api/ky";

const ky = createKy();

// Anchor "today" to Asia/KL — the audience and both providers are KL-bound,
// so a device in another zone shouldn't shift the day boundary.
const KL_ZONE = "Asia/Kuala_Lumpur";

export function useAutoPrayerTime(useAdjustment: boolean) {
  const latLong = useAtomValue(latlongAtom);
  const method = useAtomValue(methodAtom);
  const nowKl = DateTime.now().setZone(KL_ZONE);
  const today: string = nowKl.toISO() ?? "";
  const _today: string = nowKl.startOf("day").toISO() ?? "";

  return useQuery({
    queryKey: ["time", "auto", _today, useAdjustment],
    retry: 1,
    retryDelay: 500,
    enabled: latLong[0] !== null && latLong[1] !== null && method === "auto",
    queryFn: () =>
      ky
        .get("time/auto", {
          searchParams: {
            date: today,
            latitude: latLong[0] ?? "",
            longitude: latLong[1] ?? "",
            useJakimAdjustments: useAdjustment,
          },
        })
        .json<PrayerTime>(),
  });
}

export function useManualPrayerTime() {
  const method = useAtomValue(methodAtom);
  const zone = useAtomValue(zoneAtom);
  const nowKl = DateTime.now().setZone(KL_ZONE);
  const today: string = nowKl.toISO() ?? "";
  const _today: string = nowKl.startOf("day").toISO() ?? "";

  return useQuery({
    queryKey: ["time", "manual", zone, _today],
    retry: 1,
    retryDelay: 500,
    enabled: zone !== null && method === "manual",
    queryFn: () =>
      ky
        .get("time/manual", {
          searchParams: {
            date: today,
            zone: zone!,
          },
        })
        .json<PrayerTime>(),
  });
}
