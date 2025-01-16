import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import kyFactory from "ky";
import QueryClientProvider from "../query/query-provider";
import { ZONE_OPTIONS } from "@kronos/common";
import type { PrayerTimeItem } from "@kronos/common";
import type { Key } from "react-aria-components";
import { useMemo, useState } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { DateTime } from "luxon";
import { ComboBox } from "../components/base/combobox/combobox";
import { Item, Section } from "react-stately";
import { MethodToggle } from "../components/method-toggle";

console.log("meta", import.meta.env);

const createKy = () => {
  return kyFactory.create({
    prefixUrl: import.meta.env.PUBLIC_API_URL,
  });
};

const ky = createKy();
const selectedTime = atom<SelectedZoneInfo>();

function PageContent() {
  const selected = useAtomValue(selectedTime);

  const today = DateTime.now().toISODate();

  const { data } = useQuery({
    queryKey: ["time", selected],
    queryFn: async () => {
      if (!selected || !today) return null;

      return await ky
        .get("time", {
          searchParams: {
            zone: selected?.code,
            date: today,
          },
        })
        .json<PrayerTimeItem>();
    },
    enabled: !!selected,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex justify-between flex-col gap-8">
      <div>
        <MethodToggle></MethodToggle>
      </div>
      <div className="flex gap-4 flex-col w-600px">
        <TimeCard Name="imsak" Time={data?.imsak ?? "7:00 PM"} />
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

interface SelectedZoneInfo {
  id: string;
  code: string;
  zone: string;
  state: string;
}

function ZoneSelect() {
  const country = "malaysia";

  const { data } = useQuery({
    queryKey: [country, "zone"],
    queryFn: async () => {
      return await ky.get("selectionoptions").json<typeof ZONE_OPTIONS>();
    },
  });

  const listOfItems: SelectedZoneInfo[] = useMemo(() => {
    return Object.entries(data ?? {})
      ?.map(([header, entries]) => {
        return Object.entries(entries)?.map(([code, zone]) => {
          return { id: `${code}-${zone}`, code, zone, state: header };
        });
      })
      .flat();
  }, [data]);

  const [key, sKey] = useState<Key>("");

  const setZone = useSetAtom(selectedTime);

  useMemo(() => {
    const daZone = listOfItems?.find((i) => i.id === key);
    setZone(daZone);
    return daZone;
  }, [key]);

  return (
    <ComboBox
      menuTrigger="focus"
      selectedKey={key}
      onSelectionChange={(k) => sKey(k)}
      placeholder="Choose a zone"
    >
      {data!! &&
        Object.entries(data)?.map(([header, entries]) => {
          const itemList: SelectedZoneInfo[] = Object.entries(entries)?.map(
            ([code, zone]) => ({
              id: `${code}-${zone}`,
              code,
              zone,
              state: header,
            }),
          );
          return (
            <Section title={header}>
              {itemList.map((item) => (
                <Item key={`${item.code}-${item.zone}`} textValue={item.zone}>
                  {item.zone}
                </Item>
              ))}
            </Section>
          );
        })}
    </ComboBox>
  );
}
