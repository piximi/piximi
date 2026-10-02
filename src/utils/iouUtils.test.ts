import { describe, expect, it, vi } from "vitest";

import { decodeRleArray, rleEncodeArray } from "utils/image";

import {
  createCachedDecoder,
  DUPLICATE_IOU_THRESHOLD,
  isDuplicate,
  maskIoU,
  rleArea,
} from "./iouUtils";

import type { MaskedBox } from "./iouUtils";

/**
 * Build a MaskedBox from a grid of "0"/"1" strings placed at (x1, y1).
 * Each string is one row; all rows must have equal length.
 */
const box = (x1: number, y1: number, rows: string[]): MaskedBox => {
  const w = rows[0].length;
  const h = rows.length;
  const pixels = Uint8ClampedArray.from(rows.join("").split("").map(Number));
  return {
    boundingBox: [x1, y1, x1 + w, y1 + h],
    encodedMask: rleEncodeArray(pixels, true),
  };
};

describe("rleArea", () => {
  it("returns 0 for an empty encoding", () => {
    expect(rleArea([])).toBe(0);
  });

  it("sums the foreground (odd-indexed) runs", () => {
    // 2 bg, 3 fg, 1 bg, 4 fg
    expect(rleArea([2, 3, 1, 4])).toBe(7);
  });

  it("matches a decode-and-sum on random binary masks", () => {
    for (let trial = 0; trial < 20; trial++) {
      const mask = Uint8ClampedArray.from({ length: 64 }, () =>
        Math.random() < 0.5 ? 0 : 1,
      );
      const expected = mask.reduce((acc, v) => acc + v, 0);
      expect(rleArea(rleEncodeArray(mask, true))).toBe(expected);
    }
  });
});

describe("maskIoU", () => {
  it("returns 0 for disjoint bboxes without decoding", () => {
    const decode = vi.fn((m: MaskedBox) => decodeRleArray(m.encodedMask, true));
    const a = box(0, 0, ["11", "11"]);
    const b = box(5, 5, ["11", "11"]);
    expect(maskIoU(a, b, decode)).toBe(0);
    expect(decode).not.toHaveBeenCalled();
  });

  it("treats touching bboxes (shared edge) as disjoint", () => {
    const a = box(0, 0, ["11", "11"]);
    const b = box(2, 0, ["11", "11"]);
    expect(maskIoU(a, b)).toBe(0);
  });

  it("returns 1 for identical annotations", () => {
    const a = box(3, 4, ["0110", "1111", "0110"]);
    const b = box(3, 4, ["0110", "1111", "0110"]);
    expect(maskIoU(a, b)).toBe(1);
  });

  it("returns 1/3 for equal squares offset by half their width", () => {
    const a = box(0, 0, ["11", "11"]);
    const b = box(1, 0, ["11", "11"]);
    // intersection 2, union 4 + 4 - 2 = 6
    expect(maskIoU(a, b)).toBeCloseTo(1 / 3);
  });

  it("returns 0 when bboxes overlap but masks do not", () => {
    // same bbox, complementary L-shape vs. single corner pixel
    const a = box(0, 0, ["10", "11"]);
    const b = box(0, 0, ["01", "00"]);
    expect(maskIoU(a, b)).toBe(0);
  });

  it("indexes correctly across different bbox sizes and offsets", () => {
    // 3x3 full at (0,0) and 2x2 full at (2,2): overlap is pixel (2,2) only
    const a = box(0, 0, ["111", "111", "111"]);
    const b = box(2, 2, ["11", "11"]);
    // intersection 1, union 9 + 4 - 1 = 12
    expect(maskIoU(a, b)).toBeCloseTo(1 / 12);
  });

  it("indexes correctly when the bboxes have different widths", () => {
    const a = box(0, 0, ["1111"]); // [0,0,4,1]
    const b = box(1, 0, ["11", "11"]); // [1,0,3,2]
    // intersection (1,0),(2,0) = 2, union 4 + 4 - 2 = 6
    expect(maskIoU(a, b)).toBeCloseTo(1 / 3);
  });

  it("is symmetric", () => {
    const a = box(0, 0, ["111", "110"]);
    const b = box(1, 1, ["11", "01"]);
    expect(maskIoU(a, b)).toBeCloseTo(maskIoU(b, a));
  });

  it("returns 0 when both masks are empty", () => {
    const a = box(0, 0, ["00", "00"]);
    const b = box(0, 0, ["00", "00"]);
    expect(maskIoU(a, b)).toBe(0);
  });
});

describe("isDuplicate", () => {
  it("uses a 0.5 threshold", () => {
    expect(DUPLICATE_IOU_THRESHOLD).toBe(0.5);
  });

  it("is false when there are no existing annotations", () => {
    expect(isDuplicate(box(0, 0, ["11"]), [])).toBe(false);
  });

  it("is true at exactly the threshold", () => {
    // candidate is half of existing: intersection 1, union 2 → 0.5
    const existing = box(0, 0, ["11"]);
    const candidate = box(0, 0, ["10"]);
    expect(isDuplicate(candidate, [existing])).toBe(true);
  });

  it("is false below the threshold", () => {
    // intersection 1, union 3 → 0.33
    const existing = box(0, 0, ["111"]);
    const candidate = box(0, 0, ["100"]);
    expect(isDuplicate(candidate, [existing])).toBe(false);
  });

  it("is true if any existing annotation matches", () => {
    const far = box(10, 10, ["11", "11"]);
    const same = box(0, 0, ["11", "11"]);
    expect(isDuplicate(box(0, 0, ["11", "11"]), [far, same])).toBe(true);
  });
});

describe("createCachedDecoder", () => {
  it("decodes each mask object at most once", () => {
    const inner = vi.fn((m: MaskedBox) => decodeRleArray(m.encodedMask, true));
    const decode = createCachedDecoder(inner);
    const existing = box(0, 0, ["11", "11"]);
    const c1 = box(0, 0, ["11", "11"]);
    const c2 = box(1, 0, ["11", "11"]);

    isDuplicate(c1, [existing], decode);
    isDuplicate(c2, [existing], decode);

    // existing once, c1 once, c2 once
    expect(inner).toHaveBeenCalledTimes(3);
  });

  it("returns the same decoded result as an uncached decode", () => {
    const m = box(0, 0, ["101", "010"]);
    expect(createCachedDecoder()(m)).toStrictEqual(
      decodeRleArray(m.encodedMask, true),
    );
  });
});
