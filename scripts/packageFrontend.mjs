// Copies the frontend build (dist/) into the engine package so the wheel
// built from python/packages/piximi-engine serves the app by itself.
// Run `pnpm build` first (`pnpm engine:frontend` does both).
//
// In-browser model assets are left out unless `--full` is given: the ONNX
// Runtime sidecars for Cellpose-SAM (dist/ort/ and the imported .wasm) and the
// tfjs weight shards (.bin) of the bundled StarDist/GlaS models. A served page
// runs its models on the engine, and those files make up ~130 MB of the
// ~150 MB build; only the "Continue locally" fallback loses in-browser models.
import { cpSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const full = process.argv.includes("--full");
const dist = resolve("dist");
const target = resolve(
  "python/packages/piximi-engine/src/piximi_engine/frontend",
);

if (!existsSync(resolve(dist, "index.html"))) {
  console.error("No build in dist/; run `pnpm build` first.");
  process.exit(1);
}

const isModelAsset = (path) => {
  const [top] = relative(dist, path).split(sep);
  if (top === "ort") return true;
  return top === "assets" && [".wasm", ".bin"].includes(extname(path));
};

const dirSize = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const path = join(dir, entry.name);
    return sum + (entry.isDirectory() ? dirSize(path) : statSync(path).size);
  }, 0);

rmSync(target, { recursive: true, force: true });
cpSync(dist, target, {
  recursive: true,
  filter: (src) => full || !isModelAsset(src),
});
const mb = (dirSize(target) / 1048576).toFixed(1);
console.log(
  `copied dist/ -> ${target} (${mb} MB${full ? "" : ", in-browser model assets left out; pass --full to keep them"})`,
);
