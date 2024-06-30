import { useQuery } from "@tanstack/react-query";
import { TimeCard } from "../components/time-card";
import ky from "ky";

const useKy = () => {
  return ky.create({
    prefixUrl: import.meta.env.VITE_APP_API_URL,
  });
};

export async function fetchZones() {
  const data = await ky
    .get(`selectionoptions`)
    .json<ZoneOptionResponse.Response>();

  return data;
}

export function PrayerTimePage() {
  const data = useQuery({ queryKey: ["options"], queryFn: async () => {} });
  return (
    <>
      <TimeCard Name="imsak" Time="09:00" />
      <TimeCard Name="subuh" Time="09:00" />
      <TimeCard Name="syuruk" Time="09:00" />
      <TimeCard Name="zohor" Time="09:00" />
      <TimeCard Name="asar" Time="09:00" />
      <TimeCard Name="maghrib" Time="09:00" />
      <TimeCard Name="isyak" Time="09:00" />
    </>
  );
}
