import { createFileRoute } from "@tanstack/react-router";
import { PandemicPage } from "../components/pages/pandemic";

export const Route = createFileRoute("/pandemic")({
  component: PandemicPage,
});
