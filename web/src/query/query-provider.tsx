import {
  QueryClient,
  QueryClientProvider as InternalQueryClientProvider,
  QueryErrorResetBoundary,
} from "@tanstack/react-query";
import { type PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EditorialError } from "../components/editorial-error";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      retry: 1,
      retryDelay: 500,
    },
  },
});

export default function QueryClientProvider({ children }: PropsWithChildren) {
  return <InternalQueryClientProvider client={queryClient}>{children}</InternalQueryClientProvider>;
}

export function QueryErrorBoundary({ children }: PropsWithChildren) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={EditorialError} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
