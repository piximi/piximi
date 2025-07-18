import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  base: "",
  optimizeDeps: {
    exclude: ["fsevents", "chromium-bidi"],
  },
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
  assetsInclude: ["**/*.bin", "**/*.svg", "**/*.zip"],
  test: {
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    include: ["./tests/*"],
    browser: {
      provider: "playwright", // or 'webdriverio'
      enabled: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
      viewport: { width: 1280, height: 800 }, // <-- desktop size
    },
  },
});
