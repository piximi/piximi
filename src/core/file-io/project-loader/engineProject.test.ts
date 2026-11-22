import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CancelSource } from "core/dl/cancel";

import { loadProject } from "./loadProject";

/*
 * A project the engine exported (`python/packages/piximi-engine/tests/
 * vectors/gen_project.py`) opens with the browser's own reader: the file
 * format is shared, so a project moves either way between the two.
 */
const FIXTURE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../python/packages/piximi-engine/tests/vectors/project/engine.piximi",
);

describe("engine-written .piximi", () => {
  it("opens with the browser's reader", async () => {
    const bytes = readFileSync(FIXTURE);
    const file = new File([bytes], "engine.piximi", {
      type: "application/zip",
    });
    const { project } = await loadProject(
      { files: [file] },
      new CancelSource().token,
      () => {},
    );
    const { data } = project;
    expect(data.experiment.name).toBe("Engine fixture");
    expect(data.images.ids).toHaveLength(5);
    expect(
      data.images.ids.map((id) => data.images.entities[id]!.name).sort(),
    ).toEqual(["a", "b", "c", "d", "e"]);
    expect(data.kinds.ids.length).toBeGreaterThanOrEqual(2);
    // The classifier slice needs an entry for the image target and every
    // kind, whether or not the engine had classifiers for them.
    const targets = Object.keys(project.classifier.kindClassifiers).sort();
    expect(targets).toEqual(
      ["11111111-0000-0000-0000-000000000000", ...data.kinds.ids].sort(),
    );
    expect(data.annotations.ids).toHaveLength(1);
    const [annotationId] = data.annotations.ids;
    const annotation = data.annotations.entities[annotationId]!;
    expect(annotation.boundingBox).toEqual([3, 2, 9, 8]);
    expect(annotation.encodedMask.length).toBeGreaterThan(0);
    // The pixels came through as the channel's bytes.
    const b = data.images.ids
      .map((id) => data.images.entities[id]!)
      .find((image) => image.name === "b")!;
    expect(b.bitDepth).toBe(16);
    const plane = data.planes.ids
      .map((id) => data.planes.entities[id]!)
      .find((p) => p.imageId === b.id)!;
    const channels = data.channels.ids
      .map((id) => data.channels.entities[id]!)
      .filter((c) => c.planeId === plane.id);
    expect(channels).toHaveLength(2);
    expect(channels[0].data.byteLength).toBe(24 * 24 * 2);
    expect(new Uint32Array(channels[0].histogram)).toHaveLength(65536);
  });
});
