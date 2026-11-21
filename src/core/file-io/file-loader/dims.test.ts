import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { frameIndex } from "./imageReaderUtils";

import type { DimensionOrder } from "./types";

/*
 * The frame order a dimension config implies is shared with the engine:
 * `python/packages/piximi-engine/tests/vectors/gen_ingest.py` writes what
 * its `frame_index` computes, and this must agree frame for frame, or a
 * stack uploaded with a config would split differently on the two sides.
 */
const vectors = JSON.parse(
  readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../../python/packages/piximi-engine/tests/vectors/dims.json",
    ),
    "utf8",
  ),
) as {
  cases: Array<{
    order: DimensionOrder;
    channels: number;
    slices: number;
    frames: number;
    index: number[][][];
  }>;
};

describe("frameIndex (shared vectors)", () => {
  for (const c of vectors.cases) {
    it(`${c.order} with ${c.channels}c x ${c.slices}z x ${c.frames}t`, () => {
      const sizes = {
        channels: c.channels,
        slices: c.slices,
        frames: c.frames,
      };
      const seen = new Set<number>();
      for (let ci = 0; ci < c.channels; ci++) {
        for (let z = 0; z < c.slices; z++) {
          for (let t = 0; t < c.frames; t++) {
            const index = frameIndex(c.order, ci, z, t, sizes);
            expect(index).toBe(c.index[ci][z][t]);
            seen.add(index);
          }
        }
      }
      // Every frame of the stack is used exactly once.
      expect(seen.size).toBe(c.channels * c.slices * c.frames);
    });
  }

  it("puts the first listed dimension fastest, as OME does", () => {
    const sizes = { channels: 2, slices: 3, frames: 1 };
    expect(frameIndex("xyczt", 1, 0, 0, sizes)).toBe(1);
    expect(frameIndex("xyczt", 0, 1, 0, sizes)).toBe(2);
    expect(frameIndex("xyzct", 1, 0, 0, sizes)).toBe(3);
    expect(frameIndex("xyzct", 0, 1, 0, sizes)).toBe(1);
  });
});
