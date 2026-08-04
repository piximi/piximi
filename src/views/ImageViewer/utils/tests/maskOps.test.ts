import { describe, expect, it } from "vitest";

import type { BBox } from "store/dataV2/types";

import {
  difference,
  foldOperands,
  intersection,
  invertWithinBBox,
  masksOverlap,
  union,
} from "../maskOps";

import type { MaskRegion } from "../maskOps";

/** Build a region from an ASCII grid: '#' set, '.' clear. */
const region = (x0: number, y0: number, rows: string[]): MaskRegion => ({
  mask: Uint8Array.from(
    rows.flatMap((r) => [...r].map((c) => (c === "#" ? 255 : 0))),
  ),
  bbox: [x0, y0, x0 + rows[0].length, y0 + rows.length] as BBox,
});

/** Render a region back to a grid so assertions read like the fixtures. */
const show = (r: MaskRegion | null): { rows: string[]; bbox: BBox } | null => {
  if (!r) return null;
  const w = r.bbox[2] - r.bbox[0];
  const rows: string[] = [];
  for (let y = 0; y < r.bbox[3] - r.bbox[1]; y++) {
    rows.push(
      [...r.mask.slice(y * w, (y + 1) * w)]
        .map((v) => (v === 255 ? "#" : "."))
        .join(""),
    );
  }
  return { rows, bbox: r.bbox };
};

// Two 2x2 squares overlapping in exactly one pixel, at (1,1).
const A = region(0, 0, ["##", "##"]);
const B = region(1, 1, ["##", "##"]);

describe("union", () => {
  it("spans both operands", () => {
    expect(show(union(A.mask, A.bbox, B.mask, B.bbox))).toEqual({
      rows: ["##.", "###", ".##"],
      bbox: [0, 0, 3, 3],
    });
  });

  it("keeps the gap between disjoint operands", () => {
    const far = region(3, 0, ["#"]);
    expect(
      show(union(region(0, 0, ["#"]).mask, [0, 0, 1, 1], far.mask, far.bbox)),
    ).toEqual({ rows: ["#..#"], bbox: [0, 0, 4, 1] });
  });
});

describe("intersection", () => {
  it("keeps only the shared pixel and tightens to it", () => {
    expect(show(intersection(A.mask, A.bbox, B.mask, B.bbox))).toEqual({
      rows: ["#"],
      bbox: [1, 1, 2, 2],
    });
  });

  it("is null for operands whose boxes do not meet", () => {
    const far = region(9, 9, ["#"]);
    expect(intersection(A.mask, A.bbox, far.mask, far.bbox)).toBeNull();
  });

  it("is null when boxes overlap but no pixel is shared", () => {
    const a = region(0, 0, ["#.", ".."]);
    const b = region(0, 0, ["..", ".#"]);
    expect(intersection(a.mask, a.bbox, b.mask, b.bbox)).toBeNull();
  });
});

describe("difference", () => {
  it("removes the subtrahend and tightens the result", () => {
    expect(show(difference(A.mask, A.bbox, B.mask, B.bbox))).toEqual({
      rows: ["##", "#."],
      bbox: [0, 0, 2, 2],
    });
  });

  it("is order sensitive", () => {
    expect(show(difference(B.mask, B.bbox, A.mask, A.bbox))).toEqual({
      rows: [".#", "##"],
      bbox: [1, 1, 3, 3],
    });
  });

  it("is null when the subtrahend covers the minuend", () => {
    const cover = region(0, 0, ["###", "###", "###"]);
    expect(difference(A.mask, A.bbox, cover.mask, cover.bbox)).toBeNull();
  });

  it("leaves the minuend alone for a disjoint subtrahend", () => {
    const far = region(9, 9, ["#"]);
    expect(show(difference(A.mask, A.bbox, far.mask, far.bbox))).toEqual({
      rows: ["##", "##"],
      bbox: [0, 0, 2, 2],
    });
  });
});

describe("invertWithinBBox", () => {
  it("turns a hole solid without leaving the box", () => {
    const donutHole = region(0, 0, ["...", ".#.", "..."]);
    expect(show(invertWithinBBox(donutHole.mask, donutHole.bbox))).toEqual({
      rows: ["###", "#.#", "###"],
      bbox: [0, 0, 3, 3],
    });
  });

  it("is null for a fully-set mask", () => {
    expect(invertWithinBBox(A.mask, A.bbox)).toBeNull();
  });

  it("tightens when the inverse does not reach the box edge", () => {
    // Only the right column is clear, so the inverse is that column alone.
    const r = region(0, 0, ["##.", "##."]);
    expect(show(invertWithinBBox(r.mask, r.bbox))).toEqual({
      rows: ["#", "#"],
      bbox: [2, 0, 3, 2],
    });
  });
});

describe("masksOverlap", () => {
  it("is true when a pixel is shared", () => {
    expect(masksOverlap(A.mask, A.bbox, B.mask, B.bbox)).toBe(true);
  });

  it("is false when boxes overlap but masks do not", () => {
    const a = region(0, 0, ["#.", ".."]);
    const b = region(0, 0, ["..", ".#"]);
    expect(masksOverlap(a.mask, a.bbox, b.mask, b.bbox)).toBe(false);
  });

  it("is false when boxes do not meet", () => {
    const far = region(9, 9, ["#"]);
    expect(masksOverlap(A.mask, A.bbox, far.mask, far.bbox)).toBe(false);
  });
});

describe("foldOperands", () => {
  it("returns a lone operand untouched", () => {
    expect(foldOperands("union", [A])).toBe(A);
  });

  it("unions three operands", () => {
    const C = region(2, 2, ["#"]);
    expect(show(foldOperands("union", [A, B, C]))).toEqual({
      rows: ["##.", "###", ".##"],
      bbox: [0, 0, 3, 3],
    });
  });

  it("treats the first operand as the minuend for difference", () => {
    const b = region(0, 0, ["#"]);
    const c = region(1, 0, ["#"]);
    expect(show(foldOperands("difference", [A, b, c]))).toEqual({
      rows: ["##"],
      bbox: [0, 1, 2, 2],
    });
  });

  it("short-circuits to null once the accumulator empties", () => {
    const far = region(9, 9, ["#"]);
    expect(foldOperands("intersection", [A, B, far])).toBeNull();
  });

  it("is null for no operands", () => {
    expect(foldOperands("union", [])).toBeNull();
  });
});
