import { type DayPrayerTime } from "@kronos/common";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import kyFactory from "ky";
import { DateTime } from "luxon";
import { latlongAtom, methodAtom } from "../atoms";
import { MethodToggle } from "../components/method-toggle";
import { StatusBar } from "../components/status-bar";
import { TimeCard } from "../components/time-card";
import { UserCoordinate } from "../components/user-coordinate";
import QueryClientProvider from "../query/query-provider";

console.log("meta", import.meta.env);

const createKy = () => {
  return kyFactory.create({
    prefixUrl: import.meta.env.PUBLIC_API_URL,
  });
};

const ky = createKy();

function PageContent() {
  const latLong = useAtomValue(latlongAtom);
  const today = DateTime.now().toISO();

  const { data } = useQuery({
    queryKey: ["time", "auto", "latLong"],
    retry: 1,
    retryDelay: 500,
    queryFn: async () => {
      return await ky
        .get("time/auto", {
          searchParams: {
            date: today ?? "",
            latitude: latLong[0] ?? "",
            longitude: latLong[1] ?? "",
          },
        })
        .json<DayPrayerTime>();
    },
  });
  console.log("response", data);

  const method = useAtomValue(methodAtom);

  return (
    <div className="flex justify-between flex-col gap-8">
      <div>
        <MethodToggle></MethodToggle>
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
