import { useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import ky from "ky";
import QueryClientProvider from "../query/query-provider";
import {
  SelectItem,
  Select,
  SelectHeader,
  SelectSection,
} from "../components/base/select";
import { ZONE_OPTIONS } from "@kronos/common";

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

function ZoneSelect() {
  const ky = createKy();
  const country = "malaysia";

  const { data } = useQuery({
    queryKey: [country, "zone"],
    queryFn: async () => {
      const rez = await ky.get("selectionoptions").json<typeof ZONE_OPTIONS>();
      return rez;
    },
  });

  return (
    <Select>
      {data!! &&
        Object.entries(data)?.map(([header, entries]) => {
          return (
            <SelectSection key={header}>
              <SelectHeader>{header}</SelectHeader>
              {Object.entries(entries)?.map(([code, zone]) => {
                return (
                  <SelectItem key={`${code}-${zone}`}>
                    {code} - {zone}
                  </SelectItem>
                );
              })}
            </SelectSection>
          );
        })}
    </Select>
  );
}
