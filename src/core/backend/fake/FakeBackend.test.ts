import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { describeBackendConformance } from "../conformance/backendConformance";
import { FAKE_MODEL_ID, FakeBackend } from "./FakeBackend";

import type { BackendEvent } from "../events";

const seed = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
  { id: "img-c", width: 5, height: 1, channels: 2 },
  { id: "img-d", width: 3, height: 3, channels: 2 },
  { id: "img-e", width: 2, height: 3, channels: 2 },
];

/* The engine's TIFF fixtures, as files under a pretend root. */
const TIFF_FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../python/packages/piximi-engine/tests/vectors/tiff",
);
const fixtureBytes = (name: string): ArrayBuffer => {
  const bytes = readFileSync(path.join(TIFF_FIXTURES, name));
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
};
const serverFiles = {
  root: "/data",
  files: Object.fromEntries(
    ["pages6.tif", "pages12.tif", "garbage.bin"].map((name) => [
      `stacks/${name}`,
      fixtureBytes(name),
    ]),
  ),
};

describeBackendConformance("FakeBackend", async () => ({
  backend: new FakeBackend({ images: seed, files: serverFiles }),
  images: seed.map((im) => ({
    ...im,
    name: im.id,
    channelIds: [`${im.id}-ch0`, `${im.id}-ch1`],
  })),
  serverFiles: { root: serverFiles.root },
}));

describe("FakeBackend", () => {
  it("stops a run when its job is cancelled part-way", async () => {
    const backend = new FakeBackend({ images: seed });
    const jobs: string[] = [];
    backend.subscribe((e: BackendEvent) => {
      if (e.type === "jobs/didUpdate") jobs.push(e.job.status);
    });

    const summary = await backend.segmentation.run(
      {
        modelId: FAKE_MODEL_ID,
        imageIds: seed.map((im) => im.id),
        channelMetaIds: [],
        kindName: "Cell",
      },
      {
        // Cancel after the first image has been reported.
        onProgress: async ({ percent }) => {
          if (percent > 0) {
            const [job] = await backend.jobs.list();
            await backend.jobs.cancel(job.id);
          }
        },
      },
    );

    expect(summary.cancelled).toBe(true);
    expect(summary.added).toBeLessThan(seed.length);
    expect(jobs).toContain("stopping");
    expect(jobs.at(-1)).toBe("cancelled");
  });

  it("skips images that already carry an object of the kind", async () => {
    const backend = new FakeBackend({ images: seed });
    const request = {
      modelId: FAKE_MODEL_ID,
      imageIds: seed.map((im) => im.id),
      channelMetaIds: [],
      kindName: "Cell",
    };

    const first = await backend.segmentation.run(request);
    const second = await backend.segmentation.run(request);

    expect(first.added).toBe(seed.length);
    expect(second).toMatchObject({ added: 0, skipped: seed.length });
  });
});
