// Copies the frontend build (dist/) into the engine package so the wheel
// built from python/packages/piximi-engine serves the app by itself.
// Run `pnpm build` first (`pnpm engine:frontend` does both).
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve("dist");
const target = resolve(
  "python/packages/piximi-engine/src/piximi_engine/frontend",
);

if (!existsSync(resolve(dist, "index.html"))) {
  console.error("No build in dist/; run `pnpm build` first.");
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(dist, target, { recursive: true });
console.log(`copied dist/ -> ${target}`);
