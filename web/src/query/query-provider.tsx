import { QueryClient, QueryErrorResetBoundary, type Query } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  type Persister,
  type PersistedClient,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { type PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EditorialError } from "../components/editorial-error";

const ONE_HOUR_MS = 1000 * 60 * 60;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      retry: 1,
      retryDelay: 500,
      gcTime: ONE_HOUR_MS,
    },
  },
});

function createIDBPersister(key: IDBValidKey = "kronos_queries"): Persister {
  return {
    persistClient: (client) => set(key, client),
    restoreClient: () => get<PersistedClient>(key),
    removeClient: () => del(key),
  };
}

const persister = createIDBPersister();

const persistOptions = {
  persister,
  maxAge: ONE_HOUR_MS,
  buster: __APP_VERSION__,
  dehydrateOptions: {
    shouldDehydrateQuery: (q: Query) => q.state.status === "success" && q.queryKey[0] !== "sun",
  },
};

export default function QueryClientProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
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
