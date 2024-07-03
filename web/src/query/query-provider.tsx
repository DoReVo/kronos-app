import {
  QueryClient,
  QueryClientProvider as InternalQueryClientProvider,
} from "@tanstack/react-query";
import { type PropsWithChildren } from "react";

const queryClient = new QueryClient();

export default function QueryClientProvider(props: PropsWithChildren<{}>) {
  return (
    <InternalQueryClientProvider client={queryClient}>
      {props.children}
    </InternalQueryClientProvider>
  );
}
