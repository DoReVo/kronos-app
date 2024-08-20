import { useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import ky from "ky";
import QueryClientProvider from "../query/query-provider";
import {
  SelectItem,
  Select,
  SelectHeader,
  SelectSection,
} from "../components/base/zone-select";
import { ZONE_OPTIONS } from "@kronos/common";
import { Collection } from "react-aria-components";
import type { Key } from "react-aria-components";
import { useEffect, useMemo, useState } from "react";

const createKy = () => {
  return ky.create({
    prefixUrl: import.meta.env.PUBLIC_API_URL,
  });
};

export function PrayerTimePage() {
  return (
    <QueryClientProvider>
      <ZoneSelect />
      <TimeCard Name="imsak" Time="09:00" />
      <TimeCard Name="subuh" Time="09:00" />
      <TimeCard Name="syuruk" Time="09:00" />
      <TimeCard Name="zohor" Time="09:00" />
      <TimeCard Name="asar" Time="09:00" />
      <TimeCard Name="maghrib" Time="09:00" />
      <TimeCard Name="isyak" Time="09:00" />
    </QueryClientProvider>
  );
}

interface selectedZoneInfo {
  id: string;
  code: string;
  zone: string;
  state: string;
}

function ZoneSelect() {
  const ky = createKy();
  const country = "malaysia";

  const { data } = useQuery({
    queryKey: [country, "zone"],
    queryFn: async () => {
      return await ky.get("selectionoptions").json<typeof ZONE_OPTIONS>();
    },
  });

  const listOfItems: selectedZoneInfo[] = useMemo(() => {
    console.log("Re-computing listOfItems");
    return Object.entries(data ?? {})
      ?.map(([header, entries]) => {
        return Object.entries(entries)?.map(([code, zone]) => {
          return { id: `${code}-${zone}`, code, zone, state: header };
        });
      })
      .flat();
  }, [data]);

  const [key, sKey] = useState<Key>("");

  const selectedObject: selectedZoneInfo | undefined = useMemo(() => {
    console.log("Re-computing selected Item");
    return listOfItems?.find((i) => i.id === key);
  }, [key]);

  const [count, setCount] = useState(0);

  useEffect(() => {
    const x = setInterval(() => setCount((curr) => curr + 1), 1000);

    return () => {
      clearInterval(x);
    };
  }, []);

  console.log("THE SELECTED KEY", key);
  console.log("THE ACTUAL OBJECT", selectedObject);
  console.log("The current count is", count);

  return (
    <Select
      selectedKey={key}
      onSelectionChange={(k) => sKey(k)}
      items={listOfItems}
    >
      {data!! &&
        Object.entries(data)?.map(([header, entries]) => {
          const itemList: selectedZoneInfo[] = Object.entries(entries)?.map(
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
                  return <SelectItem>{item.zone}</SelectItem>;
                }}
              </Collection>
            </SelectSection>
          );
        })}
    </Select>
  );
}
