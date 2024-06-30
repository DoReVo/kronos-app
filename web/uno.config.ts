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
    /** Color palettes
     * https://coolors.co/palette/00111c-001523-001a2c-002137-00253e-002945-002e4e-003356-003a61-00406c
     */
    colors: {
      canvas: {
        DEFAULT: "#ffffff",
        dark: "#001A2C",
      },
      brand: { DEFAULT: "#003A61", light: "#00497A" },
      text_white: "#edf2f4",
    },
  },
});
