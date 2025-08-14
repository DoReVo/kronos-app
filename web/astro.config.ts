import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://kronos.izzatfaris.site",

  integrations: [
    react(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        display: "standalone",
        name: "Kronos Waktu Solat",
        short_name: "Waktu Solat",
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});