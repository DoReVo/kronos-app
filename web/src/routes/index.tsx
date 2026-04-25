import { createFileRoute } from "@tanstack/react-router";
import { PrayerTimePage } from "../components/pages/prayer-time";

export const Route = createFileRoute("/")({
  component: PrayerTimePage,
});
