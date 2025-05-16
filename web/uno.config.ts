import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      provider: "bunny",
      fonts: {
        sans: ["Domine"],
        serif: ["Atkinson Hyperlegible"],
        mono: ["Share Tech Mono"],
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  theme: {
    colors: {
      coordinate: {
        background: {
          DEFAULT: "#290025",
        },
      },
      method: {
        background: {
          DEFAULT: "#001A2A",
          selected: "#0D2635",
        },
      },
      text: {
        DEFAULT: "white",
      },
      canvas: {
        DEFAULT: "#000D15",
      },
      card: {
        background: "#001420",
      },
    },
  },
  layers: {
    base: -1,
    default: 0,
  },
});
