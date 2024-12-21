import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import kyFactory from "ky";
import QueryClientProvider from "../query/query-provider";
import {
  SelectItem,
  Select,
  SelectHeader,
  SelectSection,
} from "../components/base/zone-select";
import { ZONE_OPTIONS } from "@kronos/common";
import type { PrayerTimeItem } from "@kronos/common";
import { Collection, Text } from "react-aria-components";
import type { Key } from "react-aria-components";
import { useDeferredValue, useMemo, useState } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { DateTime } from "luxon";
import { ComboBox, Item } from "../components/base/combobox/combobox";

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
    <>
      <ComboBox withButton={false} menuTrigger="focus" label="Favorite Animal">
        <Item key="red panda">Red Panda</Item>
        <Item key="cat">Cat</Item>
        <Item key="dog">Dog</Item>
        <Item key="aardvark">Aardvark</Item>
        <Item key="kangaroo">Kangaroo</Item>
        <Item key="snake">Snake</Item>
      </ComboBox>
      <ZoneSelect />
      <TimeCard Name="imsak" Time={data?.imsak ?? ""} />
      <TimeCard Name="subuh" Time={data?.subuh ?? ""} />
      <TimeCard Name="syuruk" Time={data?.syuruk ?? ""} />
      <TimeCard Name="zohor" Time={data?.zohor ?? ""} />
      <TimeCard Name="asar" Time={data?.asar ?? ""} />
      <TimeCard Name="maghrib" Time={data?.maghrib ?? ""} />
      <TimeCard Name="isyak" Time={data?.isyak ?? ""} />
    </>
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
    <Select
      selectedKey={key}
      onSelectionChange={(k) => sKey(k)}
      items={listOfItems}
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
            <SelectSection key={header}>
              <SelectHeader>{header}</SelectHeader>
              <Collection items={itemList}>
                {(item) => {
                  return (
                    <SelectItem textValue={header}>
                      <Text slot="label">{item.zone}</Text>
                    </SelectItem>
                  );
                }}
              </Collection>
            </SelectSection>
          );
        })}
    </Select>
  );
}
