import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
    },
    maskable: {
      sizes: [512],
      resizeOptions: { background: "#f4ede0", fit: "contain" },
      padding: 0.2,
    },
    apple: {
      sizes: [180],
      resizeOptions: { background: "#f4ede0", fit: "contain" },
      padding: 0.15,
    },
  },
  images: ["public/favicon.svg"],
  headLinkOptions: {
    preset: "2023",
  },
});

void minimal2023Preset;
