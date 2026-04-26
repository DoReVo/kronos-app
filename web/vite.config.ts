import { execSync } from "node:child_process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

function gitVersion(): string {
  try {
    return execSync("git describe --tags --always --dirty", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const APP_VERSION = gitVersion();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default defineConfig(({ mode }) => {
  const cwd: string = process.cwd();
  const env = loadEnv(mode, cwd, "");
  const apiOrigin = (() => {
    try {
      return new URL(env.VITE_API_URL || "http://localhost:4305").origin;
    } catch {
      return "http://localhost:4305";
    }
  })();
  const apiPattern = new RegExp(`^${escapeRegex(apiOrigin)}/(time|currency)/`);

  return {
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
      __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    },
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        pwaAssets: {
          config: true,
          overrideManifestIcons: true,
          injectThemeColor: false,
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
          globIgnores: ["**/screenshots/**", "**/og.png"],
          cleanupOutdatedCaches: true,
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.fontshare\.com\/v2\/css/i,
              handler: "CacheFirst",
              options: {
                cacheName: "fontshare-css",
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 8 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.fontshare\.com\/.*\.(woff2?|ttf|otf)/i,
              handler: "CacheFirst",
              options: {
                cacheName: "fontshare-fonts",
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: apiPattern,
              handler: "NetworkFirst",
              method: "GET",
              options: {
                cacheName: "kronos-api",
                networkTimeoutSeconds: 4,
                expiration: { maxAgeSeconds: 60 * 60 * 24, maxEntries: 50 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: "/",
          scope: "/",
          start_url: "/?source=pwa",
          name: "Kronos — A private almanac",
          short_name: "Kronos",
          description:
            "A private almanac of personal utilities — prayer times, currency, and forthcoming editions.",
          lang: "en",
          dir: "ltr",
          display: "standalone",
          display_override: ["standalone", "minimal-ui"],
          orientation: "portrait",
          theme_color: "#f4ede0",
          background_color: "#f4ede0",
          categories: ["utilities", "productivity", "lifestyle"],
          icons: [{ src: "/favicon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" }],
          shortcuts: [
            {
              name: "Prayer Time",
              short_name: "Prayer",
              url: "/prayer-time?source=shortcut",
              description: "Today's prayer times — JAKIM zones or astronomical.",
              icons: [{ src: "/shortcut-02.svg", sizes: "96x96", type: "image/svg+xml" }],
            },
            {
              name: "Currency",
              short_name: "Currency",
              url: "/currency?source=shortcut",
              description: "FX rates against the United States dollar.",
              icons: [{ src: "/shortcut-04.svg", sizes: "96x96", type: "image/svg+xml" }],
            },
          ],
          screenshots: [
            {
              src: "/screenshots/home-narrow.png",
              sizes: "780x1688",
              type: "image/png",
              form_factor: "narrow",
              label: "Contents",
            },
            {
              src: "/screenshots/prayer-narrow.png",
              sizes: "780x1688",
              type: "image/png",
              form_factor: "narrow",
              label: "Prayer times",
            },
            {
              src: "/screenshots/currency-narrow.png",
              sizes: "780x1688",
              type: "image/png",
              form_factor: "narrow",
              label: "Currency rates",
            },
            {
              src: "/screenshots/home-wide.png",
              sizes: "1440x900",
              type: "image/png",
              form_factor: "wide",
              label: "Contents",
            },
            {
              src: "/screenshots/prayer-wide.png",
              sizes: "1440x900",
              type: "image/png",
              form_factor: "wide",
              label: "Prayer times",
            },
            {
              src: "/screenshots/currency-wide.png",
              sizes: "1440x900",
              type: "image/png",
              form_factor: "wide",
              label: "Currency rates",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
