import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles/global.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

if (import.meta.env.PROD) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://zapdos.izzatfaris.site/script.js";
  s.dataset.websiteId = "e6154266-985b-4f15-af73-c141cc61f034";
  document.head.append(s);
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
