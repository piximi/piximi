import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { UNKNOWN_KIND_ID } from "core/entities";

import { loadProject } from "./loadProject";

import type { LoadProjectOutput } from "./types";

/**
 * Golden-master coverage for the legacy readers and converters.
 *
 * `saveProject.test.ts` is a pure self-round-trip: it writes and reads with the
 * same code, so it cannot detect a reader that misinterprets an archive it did
 * not produce. These tests drive the real `loadProject` entry point — including
 * `detectVersion`'s routing — against archives Piximi actually shipped, which
 * are the only artifacts of the 0.1 / 0.2 / 1.1 writers still in existence.
 *
 * The fixtures are the example projects already committed under
 * `src/data/exampleProjects/`, so this costs no repository size. They are also
 * what users load from the Open-Example dialog, making a regression here
 * immediately user-facing.
 *
 * The smallest archive per format version is used; the others come from the
 * same writers and would only add wall-clock time.
 */
const FIXTURES = [
  {
    version: "0.1.0",
    file: "mnistExampleProject.zip",
    images: 1000,
    channels: 1000,
    channelMetas: 1,
    categories: 12,
    annotations: 0,
    kindIds: [UNKNOWN_KIND_ID],
  },
  {
    version: "0.2.0",
    file: "Piximi_Translocation_Tutorial_RGB.zip",
    images: 17,
    channels: 51,
    channelMetas: 3,
    categories: 13,
    annotations: 0,
    kindIds: [UNKNOWN_KIND_ID],
  },
  {
    version: "1.1.0",
    file: "U2OSCellPaintingExampleProject.zip",
    images: 1,
    channels: 3,
    channelMetas: 3,
    categories: 4,
    annotations: 186,
    // v1.1 keyed kinds by their user-typed display name, not a UUID. Those
    // strings become zarr group names, so they also pin path handling.
    kindIds: [UNKNOWN_KIND_ID, "Cell membrane", "Cell nucleus"],
  },
] as const;

const load = async (file: string): Promise<LoadProjectOutput> => {
  const bytes = await readFile(`src/data/exampleProjects/${file}`);
  // `openStore` branches on the MIME type to pick the zip path over the
  // `webkitdirectory` path, so it has to be set. The Buffer is copied to a
  // plain Uint8Array because a Buffer can be a view onto a pooled allocation.
  const asFile = new File([new Uint8Array(bytes)], file, {
    type: "application/zip",
  });
  return loadProject({ files: [asFile] }, { cancelled: false }, () => {});
};

describe.each(FIXTURES)("legacy project $version ($file)", (fixture) => {
  it("routes to the right reader and populates every collection", async () => {
    const { project } = await load(fixture.file);
    const { data } = project;

    expect(data.images.ids).toHaveLength(fixture.images);
    expect(data.imageSeries.ids).toHaveLength(fixture.images);
    expect(data.planes.ids).toHaveLength(fixture.images);
    expect(data.channels.ids).toHaveLength(fixture.channels);
    expect(data.channelMetas.ids).toHaveLength(fixture.channelMetas);
    expect(data.categories.ids).toHaveLength(fixture.categories);
    expect(data.annotations.ids).toHaveLength(fixture.annotations);
    expect(data.annotationVolumes.ids).toHaveLength(fixture.annotations);
    expect(data.kinds.ids).toEqual([...fixture.kindIds]);

    // Every image must resolve to a category and an active plane, or the
    // project viewer renders a blank grid.
    for (const id of data.images.ids) {
      const image = data.images.entities[id]!;
      expect(data.categories.ids).toContain(image.categoryId);
      expect(data.planes.ids).toContain(image.activePlaneId);
    }
  });

  /**
   * The assertion that catches an under-specified selection.
   *
   * `colorMap` comes from `common.ts`'s `deserializeColorsRaw`, which reads the
   * rank-2 `color` dataset with a rank-1 selection (`[null]`). zarr.js pads a
   * short selection to full rank; a reader that does not pad misses the chunk
   * entirely and gets the fill value — all zeros — with no error, then reads
   * past the end of the flat array for the second and third components.
   * Asserting on `ids.length` alone would not notice.
   */
  it("recovers finite, fully-populated channel colors", async () => {
    const { project } = await load(fixture.file);
    const metas = project.data.channelMetas;

    expect(metas.ids.length).toBeGreaterThan(0);

    for (const id of metas.ids) {
      const meta = metas.entities[id]!;

      expect(meta.colorMap).toHaveLength(3);
      for (const component of meta.colorMap) {
        expect(typeof component).toBe("number");
        expect(Number.isFinite(component)).toBe(true);
        // Colors are stored as 0..1 floats, not 0..255 bytes.
        expect(component).toBeGreaterThanOrEqual(0);
        expect(component).toBeLessThanOrEqual(1);
      }
      // An all-zero triple is exactly what the fill-value path produces. No
      // shipped example uses pure black for a channel.
      expect(meta.colorMap.some((c) => c !== 0)).toBe(true);

      // Ramps must stay ordered and finite, or the renderer's contrast
      // mapping divides by zero.
      expect(Number.isFinite(meta.rampMin)).toBe(true);
      expect(Number.isFinite(meta.rampMax)).toBe(true);
      expect(meta.rampMax).toBeGreaterThan(meta.rampMin);
    }
  });

  it("recovers pixel buffers sized exactly to their channel dimensions", async () => {
    const { project } = await load(fixture.file);
    const channels = project.data.channels;

    for (const id of channels.ids) {
      const channel = channels.entities[id]!;

      expect(channel.bitDepth === 8 || channel.bitDepth === 16).toBe(true);
      const bytesPerPixel = channel.bitDepth === 8 ? 1 : 2;
      // Catches both an over-long buffer (a view onto a larger allocation
      // reaching IndexedDB) and a wrong element width.
      expect(channel.data.byteLength).toBe(
        channel.width * channel.height * bytesPerPixel,
      );
      expect(channel.histogram.byteLength).toBeGreaterThan(0);
    }
  });
});
