import { useAtomValue } from "jotai";
import { useState } from "react";
import { methodAtom } from "../../atoms";
import { MethodToggle } from "../method-toggle";
import { StatusBar } from "../status-bar";
import { TimeCard } from "../time-card";
import { UserCoordinate } from "../user-coordinate";
import QueryClientProvider from "../../query/query-provider";
import { Switch } from "../base/Switch";
import { ZoneSelector } from "../ZoneSelector";
import { useAutoPrayerTime, useManualPrayerTime } from "../../hooks/use-prayer-time";

function PageContent() {
  const method = useAtomValue(methodAtom);
  const [useAdjustment, setUseAdjustment] = useState(false);

  const { data: autoZoneData } = useAutoPrayerTime(useAdjustment);
  const { data: manualZoneData } = useManualPrayerTime();

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
