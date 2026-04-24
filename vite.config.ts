import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: {
    "@api": "/src/api",
    "@assets": "/src/assets",
    "@shared": "/src/shared",

    "@zix/composables": "/src/zix/composables",
    "@zix/components": "/src/zix/components",
    "@zix/types": "/src/zix/types",
    "@zix/core": "/src/zix/core",
  }},
});

