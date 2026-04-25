import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { motion } from "motion/react";
import { itemVariants, pageVariants } from "../components/page-frame";
import { ThemeToggle } from "../components/theme-toggle";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { pathname } = useLocation();

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 mx-auto w-full max-w-4xl px-6 sm:px-10 py-6 sm:py-10"
        >
          <motion.div variants={itemVariants} className="flex justify-end mb-6 sm:mb-8">
            <ThemeToggle />
          </motion.div>
          <Outlet />
        </motion.main>
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
