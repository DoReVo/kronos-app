import { type PrayerTime } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { latlongAtom } from "../atoms";
import { createKy } from "../api/ky";

const ky = createKy();

export function useTodaySun() {
  const latlong = useAtomValue(latlongAtom);
  const today: string = DateTime.now().toISO();
  const _today: string = DateTime.now().startOf("day").toISO();

  return useQuery({
    queryKey: ["sun", "today", _today, latlong[0], latlong[1]],
    enabled: latlong[0] !== null && latlong[1] !== null,
    refetchInterval: 60 * 60 * 1000,
    throwOnError: false,
    queryFn: () =>
      ky
        .get("time/auto", {
          searchParams: {
            date: today,
            latitude: latlong[0] ?? "",
            longitude: latlong[1] ?? "",
            useJakimAdjustments: false,
          },
        })
        .json<PrayerTime>(),
  });
}
