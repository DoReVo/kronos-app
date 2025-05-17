import { type PrayerTime } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { latlongAtom, methodAtom } from "../atoms";
import { MethodToggle } from "../components/method-toggle";
import { StatusBar } from "../components/status-bar";
import { TimeCard } from "../components/time-card";
import { UserCoordinate } from "../components/user-coordinate";
import QueryClientProvider from "../query/query-provider";
import { createKy } from "../api/ky";
import { Switch } from "../components/base/Switch";
import { useState } from "react";

const ky = createKy();

function PageContent() {
  const latLong = useAtomValue(latlongAtom);
  const today = DateTime.now().toISO();
  const _today = DateTime.now().startOf("day").toISO();

  const [useAdjustment, setUseAdjustment] = useState(false);

  const { data } = useQuery({
    queryKey: ["time", "auto", _today, useAdjustment],
    retry: 1,
    retryDelay: 500,
    refetchInterval: 30000,
    enabled: latLong[0] !== null && latLong[1] !== null,
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

  const method = useAtomValue(methodAtom);

  const onChangeAdjustment = (value: boolean) => {
    setUseAdjustment(value);
  };

  return (
    <div className="flex justify-between flex-col gap-8">
      <div>
        <MethodToggle></MethodToggle>
      </div>
      {method === "auto" && (
        <>
          <div className="flex justify-center">
            <Switch isSelected={useAdjustment} onChange={onChangeAdjustment}>
              Use Jakim time
            </Switch>
          </div>
          <div>
            <UserCoordinate />
          </div>
        </>
      )}

      <div className="flex justify-center">
        <StatusBar />
      </div>
      <div className="flex gap-4 flex-col items-center w-600px">
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
