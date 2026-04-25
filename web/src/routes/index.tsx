import { createFileRoute } from "@tanstack/react-router";
import { ContentsPage } from "../components/pages/contents";

export const Route = createFileRoute("/")({
  component: ContentsPage,
});
