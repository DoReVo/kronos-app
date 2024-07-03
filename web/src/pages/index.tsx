import { useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import ky from "ky";
import QueryClientProvider from "../query/query-provider";
import { MyItem, MySelect } from "../components/base/select";

const useKy = () => {
  return ky.create({
    prefixUrl: import.meta.env.VITE_APP_API_URL,
  });
};

export function PrayerTimePage() {
  const items = [
    {
      id: "1",
      label: "TWO STEP",
    },
  ];
  return (
    <QueryClientProvider>
      <MySelect items={items} onSelectionChange={console.log}>
        <MyItem>One</MyItem>
        <MyItem>Two</MyItem>
      </MySelect>
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
