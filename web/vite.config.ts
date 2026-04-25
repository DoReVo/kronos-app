import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        display: "standalone",
        name: "Kronos — A private almanac",
        short_name: "Kronos",
        description: "A private almanac of personal utilities.",
        theme_color: "#f4ede0",
        background_color: "#f4ede0",
        icons: [
          {
            src: "/favicon.svg",
            type: "image/svg+xml",
            sizes: "any",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
