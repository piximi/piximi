import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { decodeRleArray, rleEncodeArray } from "./rle";

/*
 * The Python engine encodes masks with the same scheme; both sides check
 * the same vectors so the formats cannot drift apart.
 */
const vectors = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      "../../../python/packages/piximi-engine/tests/vectors/rle.json",
    ),
    "utf8",
  ),
) as {
  cases: Array<{
    name: string;
    shape: [number, number];
    mask: number[];
    runs: number[];
  }>;
};

describe("rle (shared vectors)", () => {
  for (const { name, mask, runs } of vectors.cases) {
    it(name, () => {
      expect(rleEncodeArray(Uint8Array.from(mask), true)).toEqual(runs);
      expect([...decodeRleArray(runs, true)]).toEqual(mask);
    });
  }
});
