import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
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
  theme: {
    colors: {
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
