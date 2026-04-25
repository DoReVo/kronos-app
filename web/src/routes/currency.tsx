import { createFileRoute } from "@tanstack/react-router";
import { CurrencyConverter } from "../components/pages/currency";

export const Route = createFileRoute("/currency")({
  component: CurrencyConverter,
});
