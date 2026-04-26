import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeToggle } from "../components/theme-toggle";
import { OfflineMark } from "../components/offline-mark";
import { PressNotice } from "../components/press-notice";
import QueryClientProvider, { QueryErrorBoundary } from "../query/query-provider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-4xl px-6 sm:px-10 py-6 sm:py-10">
          <div className="flex justify-end items-center gap-4 mb-6 sm:mb-8">
            <OfflineMark />
            <ThemeToggle />
          </div>
          <QueryErrorBoundary>
            <Outlet />
          </QueryErrorBoundary>
        </main>
      </div>
      <PressNotice />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </QueryClientProvider>
  );
}
