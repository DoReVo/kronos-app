import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import AstroPWA from "@vite-pwa/astro";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://kronos.izzatfaris.site",
  integrations: [
    UnoCSS({
      injectReset: true,
    }),
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
});
