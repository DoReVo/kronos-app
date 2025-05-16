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

const ky = createKy();

function PageContent() {
  const latLong = useAtomValue(latlongAtom);
  const today = DateTime.now().toISO();
  const _today = DateTime.now().startOf("day").toISO();

  const { data } = useQuery({
    queryKey: ["time", "auto", _today],
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
            useJakimAdjustments: true,
          },
        })
        .json<PrayerTime>();
    },
  });

  const method = useAtomValue(methodAtom);

  return (
    <div className="flex justify-between flex-col gap-8">
      <div>
        <MethodToggle></MethodToggle>
      </div>
      <div>
        <Switch>Use Jakim time</Switch>
      </div>
      {method === "auto" && (
        <div>
          <UserCoordinate />
        </div>
      )}

      <div className="flex justify-center">
        <StatusBar />
      </div>
      <div className="flex gap-4 flex-col items-center w-600px">
        <TimeCard Name="imsak" Time={data?.imsak ?? ""} />
        <TimeCard Name="subuh" Time={data?.subuh ?? ""} />
        <TimeCard Name="syuruk" Time={data?.syuruk ?? ""} />
        <TimeCard Name="zohor" Time={data?.zohor ?? ""} />
        <TimeCard Name="asar" Time={data?.asar ?? ""} />
        <TimeCard Name="maghrib" Time={data?.maghrib ?? ""} />
        <TimeCard Name="isyak" Time={data?.isyak ?? ""} />
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
