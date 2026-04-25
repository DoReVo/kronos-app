import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

const linkClass = "p-4 bg-card-background text-card-text";

function RootComponent() {
  return (
    <>
      <div className="flex min-h-screen font-sans p-4 justify-center gap-4">
        <nav className="sm:flex gap-2 flex-col px-4 rounded border-card-border hidden none">
          <div className="px-4 pb-4 font-bold text-card-text">Applications</div>
          <Link to="/" className={linkClass}>
            Prayer Time
          </Link>
          <a href="/" className={linkClass}>
            Covid Dashboard
          </a>
          <a href="/" className={linkClass}>
            Bantu
          </a>
          <a href="/" className={linkClass}>
            Sensasi
          </a>
          <div className="p-4 font-bold text-card-text">Utilities</div>
          <a href="/" className={linkClass}>
            Currency Converter
          </a>
          <a href="/" className={linkClass}>
            TimeZone Converter
          </a>
          <a href="/" className={linkClass}>
            Unit Converter
          </a>
          <a href="/" className={linkClass}>
            Net Pay Calculator
          </a>
        </nav>
        <main className="flex flex-col flex-[1_0_0] max-w-xl">
          <Outlet />
        </main>
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
