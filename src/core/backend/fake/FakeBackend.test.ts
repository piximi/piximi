import { describe, expect, it } from "vitest";

import { describeBackendConformance } from "../conformance/backendConformance";
import { FAKE_MODEL_ID, FakeBackend } from "./FakeBackend";

import type { BackendEvent } from "../events";

const seed = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
  { id: "img-c", width: 5, height: 1, channels: 2 },
];

describeBackendConformance("FakeBackend", async () => ({
  backend: new FakeBackend({ images: seed }),
  images: seed.map((im) => ({
    ...im,
    channelIds: [`${im.id}-ch0`, `${im.id}-ch1`],
  })),
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
