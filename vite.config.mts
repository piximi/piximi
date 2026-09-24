/// <reference types="vitest" />
import path from "path";
import fs from "fs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";

import type { Plugin } from "vite";

// cellpose-js -> onnxruntime-web dynamically imports its WASM glue (.mjs) from
// the path set via configureOrt({ wasmPaths: "/ort/" }). Those files live in
// public/ort, but Vite forbids importing files out of /public from source code,
// so the dynamic import fails in dev. Serve /ort/* as raw files from public/ort
// before Vite's transform pipeline runs, sidestepping that guard. (In a build,
// public/ort is emitted statically and this plugin is inactive.)
function serveOrtSidecars(): Plugin {
  const ortDir = path.resolve("public/ort");
  return {
    name: "serve-ort-sidecars",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/ort/")) return next();
        const fileName = url.slice("/ort/".length).split("?")[0];
        const filePath = path.join(ortDir, fileName);
        if (
          !fileName ||
          !filePath.startsWith(ortDir) ||
          !fs.existsSync(filePath)
        ) {
          return next();
        }
        res.setHeader(
          "Content-Type",
          filePath.endsWith(".wasm") ? "application/wasm" : "text/javascript",
        );
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  // depending on your application, base can also be "/"
  base: "",
  plugins: [react(), viteTsconfigPaths(), serveOrtSidecars()],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
  },
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
      core: path.resolve("src/core"),
      "@ProjectViewer": path.resolve("src/views/ProjectViewer"),
      "@ImageViewer": path.resolve("src/views/ImageViewer"),
      "@MeasurementViewer": path.resolve("src/views/MeasurementViewer"),
      translations: path.resolve("src/translations"),
    },
  },
  optimizeDeps: {
    // cellpose-js spawns its own module worker via
    // `new Worker(new URL("./inference.worker.js", import.meta.url))`. If Vite
    // pre-bundles the package into .vite/deps, `import.meta.url` points there and
    // the relative worker URL 404s ("worker module failed to load"). Keep
    // cellpose-js (and the ORT runtime its worker imports) at their real paths so
    // the worker URL resolves and Vite serves it.
    exclude: ["cellpose-js", "onnxruntime-web", "onnxruntime-web/webgpu"],
  },
  server: {
    // this ensures that the browser opens upon server start
    open: true,
    // this sets a default port to 3000
    port: 3000,
  },
  preview: {},
  assetsInclude: ["**/*.bin", "**/*.svg", "**/*.zip"],
  test: {
    setupFiles: ["./test-setup.ts"],
    environment: "happy-dom",
    testTimeout: 50_000,
  },
});
