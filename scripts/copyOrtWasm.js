import fs from "fs";
import path from "path";

/*
 * cellpose-js runs ONNX Runtime Web, whose WASM/JSEP sidecar files must be
 * served same-origin (cross-origin dynamic .mjs import is blocked). Copy them
 * out of node_modules into public/ort/ so Vite serves them at "/ort/" — the
 * path passed to configureOrt({ wasmPaths: "/ort/" }) in CellposeSAM.
 *
 * Runs from the "prepare" lifecycle script, after dependencies are installed.
 * The copied binaries are git-ignored (see .gitignore).
 */
const srcDir = "node_modules/onnxruntime-web/dist";
const destDir = "public/ort";

if (!fs.existsSync(srcDir)) {
  console.warn(
    `[copyOrtWasm] ${srcDir} not found; skipping (is onnxruntime-web installed?)`,
  );
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter(
    (f) =>
      f.startsWith("ort-wasm-simd-threaded") &&
      (f.endsWith(".wasm") || f.endsWith(".mjs")),
  );

for (const f of files) {
  fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
}

console.log(
  `[copyOrtWasm] copied ${files.length} ORT sidecar files to ${destDir}`,
);
