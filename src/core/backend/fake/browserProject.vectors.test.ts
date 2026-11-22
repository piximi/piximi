import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { FakeBackend } from "./FakeBackend";

/*
 * Writes `project/browser.piximi` with the browser's own writer, for the
 * engine's reader (`tests/test_project.py`). Run with
 * `PIXIMI_WRITE_VECTORS=1`; otherwise it only checks the writer runs.
 */
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../python/packages/piximi-engine/tests/vectors/project/browser.piximi",
);

const seed = [
  { id: "img-a", width: 6, height: 4, channels: 2 },
  { id: "img-b", width: 3, height: 5, channels: 2 },
];

describe("browser-written .piximi", () => {
  it("is written by the fake backend's export", async () => {
    const backend = new FakeBackend({ images: seed });
    await backend.project.rename("Browser fixture");
    const file = await backend.project.export("browser");
    expect(file.fileName).toBe("browser.piximi");
    expect(file.data.byteLength).toBeGreaterThan(1000);
    if (process.env.PIXIMI_WRITE_VECTORS === "1") {
      mkdirSync(path.dirname(OUT), { recursive: true });
      writeFileSync(OUT, file.data);
    }
  });
});
