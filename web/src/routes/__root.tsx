import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeToggle } from "../components/theme-toggle";
import QueryClientProvider, { QueryErrorBoundary } from "../query/query-provider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-4xl px-6 sm:px-10 py-6 sm:py-10">
          <div className="flex justify-end mb-6 sm:mb-8">
            <ThemeToggle />
          </div>
          <QueryErrorBoundary>
            <Outlet />
          </QueryErrorBoundary>
        </main>
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </QueryClientProvider>
  );
}
