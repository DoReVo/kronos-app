import { type PrayerTime } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { latlongAtom, methodAtom, zoneAtom } from "../../atoms";
import { MethodToggle } from "../method-toggle";
import { StatusBar } from "../status-bar";
import { TimeCard } from "../time-card";
import { UserCoordinate } from "../user-coordinate";
import QueryClientProvider from "../../query/query-provider";
import { createKy } from "../../api/ky";
import { Switch } from "../base/Switch";
import { useState } from "react";
import { ZoneSelector } from "../ZoneSelector";

const ky = createKy();

function PageContent() {
  const latLong = useAtomValue(latlongAtom);
  const today = DateTime.now().toISO();
  const _today = DateTime.now().startOf("day").toISO();

  const method = useAtomValue(methodAtom);
  const [useAdjustment, setUseAdjustment] = useState(false);

  const { data: autoZoneData } = useQuery({
    queryKey: ["time", "auto", _today, useAdjustment],
    retry: 1,
    retryDelay: 500,
    refetchInterval: 30000,
    enabled: latLong[0] !== null && latLong[1] !== null && method === "auto",
    select(data) {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          DateTime.fromISO(value).toLocaleString(DateTime.TIME_SIMPLE),
        ]),
      ) as PrayerTime;
    },
    queryFn: async () => {
      return await ky
        .get("time/auto", {
          searchParams: {
            date: today ?? "",
            latitude: latLong[0] ?? "",
            longitude: latLong[1] ?? "",
            useJakimAdjustments: useAdjustment,
          },
        })
        .json<PrayerTime>();
    },
  });

  const zone = useAtomValue(zoneAtom);

  const { data: manualZoneData } = useQuery({
    queryKey: ["time", "manual", zone],
    retry: 1,
    retryDelay: 500,
    refetchInterval: 30000,
    enabled: zone !== null && method === "manual",
    select(data) {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          DateTime.fromISO(value).toLocaleString(DateTime.TIME_SIMPLE),
        ]),
      ) as PrayerTime;
    },
    queryFn: async () => {
      return await ky
        .get("time/manual", {
          searchParams: {
            date: today,
            zone: zone!,
          },
        })
        .json<PrayerTime>();
    },
  });

  const data = method === "auto" ? autoZoneData : manualZoneData;

  const onChangeAdjustment = (value: boolean) => {
    setUseAdjustment(value);
  };

  return (
    <div className="flex-[1_0_0] flex justify-between flex-col gap-8">
      <MethodToggle />
      <div id="selector" className="flex flex-col">
        {method === "auto" && (
          <div>
            <div className="flex justify-center">
              <Switch isSelected={useAdjustment} onChange={onChangeAdjustment}>
                Use Jakim time
              </Switch>
            </div>
            <UserCoordinate />
          </div>
        )}

        {method === "manual" && (
          <div className="mx-auto">
            <ZoneSelector />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <StatusBar />
      </div>
      <div className="flex gap-4 flex-col items-center">
        <TimeCard name="imsak" time={data?.imsak ?? ""} />
        <TimeCard name="subuh" time={data?.subuh ?? ""} />
        <TimeCard name="syuruk" time={data?.syuruk ?? ""} />
        <TimeCard name="zohor" time={data?.zohor ?? ""} />
        <TimeCard name="asar" time={data?.asar ?? ""} />
        <TimeCard name="maghrib" time={data?.maghrib ?? ""} />
        <TimeCard name="isyak" time={data?.isyak ?? ""} />
      </div>
    </div>
  );
}

export function PrayerTimePage() {
  return (
    <QueryClientProvider>
      <PageContent />
    </QueryClientProvider>
  );
}
