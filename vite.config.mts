/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  // depending on your application, base can also be "/"
  base: "",
  plugins: [react(), viteTsconfigPaths()],
  // vite in dev mode works without this
  // but on build rollup fails to resolve these
  // would be nice to figure out a more robust config that both understand
  resolve: {
    alias: {
      utils: path.resolve("src/utils/"),
      views: path.resolve("src/views/"),
      components: path.resolve("src/components"),
      contexts: path.resolve("src/contexts"),
      data: path.resolve("src/data"),
      hooks: path.resolve("src/hooks"),
      icons: path.resolve("src/icons"),
      images: path.resolve("src/images"),
      store: path.resolve("src/store"),
      themes: path.resolve("src/themes"),
      translations: path.resolve("src/translations"),
    },
  },

  server: {
    // this ensures that the browser opens upon server start
    open: true,
    // this sets a default port to 3000
    port: 3000,
  },
  assetsInclude: ["**/*.bin", "**/*.svg", "**/*.zip"],
  test: {
    setupFiles: ["./test-setup.ts"],
    environment: "happy-dom",
    //exclude : [ '**/*.spec.ts']
  },
});
