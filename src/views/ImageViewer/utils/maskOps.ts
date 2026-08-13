import type { BBox, DataArray } from "store/data/types";

/**
 * Set operations on annotation masks.
 *
 * A mask is a row-major `w * h` array of 0/255 covering exactly its bounding box,
 * so every operation has to translate between image coordinates and each
 * operand's local indexing. `sample` does that translation once and returns 0
 * outside the box, which removes the per-operation delta arithmetic these
 * functions used to carry when they lived on `AnnotationTool`.
 *
 * Extracted from AnnotationTool.add/intersect/subtract/invert, which combined
 * their argument with the tool's *own* in-flight stroke and bailed out when
 * there wasn't one — making operations between two committed annotations
 * impossible to express.
 */

export type MaskRegion = { mask: Uint8Array; bbox: BBox };

const width = (bbox: BBox) => bbox[2] - bbox[0];
const height = (bbox: BBox) => bbox[3] - bbox[1];

/** Read a mask at image coordinates, 0 outside its bounding box. */
const sample = (mask: DataArray, bbox: BBox, x: number, y: number): number => {
  const lx = x - bbox[0];
  const ly = y - bbox[1];
  if (lx < 0 || ly < 0 || lx >= width(bbox) || ly >= height(bbox)) return 0;
  return mask[lx + ly * width(bbox)] ?? 0;
};

const rasterize = (
  bbox: BBox,
  at: (x: number, y: number) => number,
): MaskRegion | null => {
  const w = width(bbox);
  const h = height(bbox);
  if (w <= 0 || h <= 0) return null;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = at(bbox[0] + (i % w), bbox[1] + Math.floor(i / w));
  }
  return { mask, bbox };
};

/**
 * Shrink a region to the extent of its set pixels, or null when nothing is set.
 *
 * The original `subtract` tried to precompute a tightened box from the operands'
 * geometry with four nested conditionals that only handled a subtrahend spanning
 * a full side. Rasterizing over the minuend's box and measuring the result is
 * both simpler and correct, and it gives the empty case for free.
 */
const tighten = (region: MaskRegion | null): MaskRegion | null => {
  if (!region) return null;
  const { mask, bbox } = region;
  const w = width(bbox);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== 255) continue;
    const x = i % w;
    const y = Math.floor(i / w);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (minX === Infinity) return null;

  const tight: BBox = [
    bbox[0] + minX,
    bbox[1] + minY,
    bbox[0] + maxX + 1,
    bbox[1] + maxY + 1,
  ];
  if (
    tight[0] === bbox[0] &&
    tight[1] === bbox[1] &&
    tight[2] === bbox[2] &&
    tight[3] === bbox[3]
  )
    return region;

  const tw = width(tight);
  const cropped = new Uint8Array(tw * height(tight));
  for (let i = 0; i < cropped.length; i++) {
    const x = i % tw;
    const y = Math.floor(i / tw);
    cropped[i] = mask[minX + x + (minY + y) * w];
  }
  return { mask: cropped, bbox: tight };
};

/** Everything in either operand. Never empty when either operand is non-empty. */
export const union = (
  a: DataArray,
  bboxA: BBox,
  b: DataArray,
  bboxB: BBox,
): MaskRegion | null =>
  tighten(
    rasterize(
      [
        Math.min(bboxA[0], bboxB[0]),
        Math.min(bboxA[1], bboxB[1]),
        Math.max(bboxA[2], bboxB[2]),
        Math.max(bboxA[3], bboxB[3]),
      ],
      (x, y) =>
        sample(a, bboxA, x, y) === 255 || sample(b, bboxB, x, y) === 255
          ? 255
          : 0,
    ),
  );

/** Only what both operands cover. Null when they don't overlap. */
export const intersection = (
  a: DataArray,
  bboxA: BBox,
  b: DataArray,
  bboxB: BBox,
): MaskRegion | null =>
  tighten(
    rasterize(
      [
        Math.max(bboxA[0], bboxB[0]),
        Math.max(bboxA[1], bboxB[1]),
        Math.min(bboxA[2], bboxB[2]),
        Math.min(bboxA[3], bboxB[3]),
      ],
      (x, y) =>
        sample(a, bboxA, x, y) === 255 && sample(b, bboxB, x, y) === 255
          ? 255
          : 0,
    ),
  );

/** Minuend less subtrahend. Null when the subtrahend erases the minuend. */
export const difference = (
  minuend: DataArray,
  minuendBBox: BBox,
  subtrahend: DataArray,
  subtrahendBBox: BBox,
): MaskRegion | null =>
  tighten(
    rasterize(minuendBBox, (x, y) =>
      sample(minuend, minuendBBox, x, y) === 255 &&
      sample(subtrahend, subtrahendBBox, x, y) !== 255
        ? 255
        : 0,
    ),
  );

/**
 * Flip set and unset *within the mask's own bounding box*, so holes become solid
 * and solid becomes holes without the result spilling across the image.
 *
 * The old `invert` inverted against the full image instead, and then searched for
 * the result's extent with an `else if` chain that could not widen a box it had
 * just narrowed — and cropped with `origin: { row: bbox[0], column: bbox[1] }`,
 * passing x as the row and y as the column. Bounding the inversion to the input
 * box removes the search entirely: the extent is known up front.
 */
export const invertWithinBBox = (
  mask: DataArray,
  bbox: BBox,
): MaskRegion | null =>
  tighten(
    rasterize(bbox, (x, y) => (sample(mask, bbox, x, y) === 255 ? 0 : 255)),
  );

/** Whether two masks share any set pixel. Bounding boxes are the cheap prefilter. */
export const masksOverlap = (
  a: DataArray,
  bboxA: BBox,
  b: DataArray,
  bboxB: BBox,
): boolean => {
  const x0 = Math.max(bboxA[0], bboxB[0]);
  const y0 = Math.max(bboxA[1], bboxB[1]);
  const x1 = Math.min(bboxA[2], bboxB[2]);
  const y1 = Math.min(bboxA[3], bboxB[3]);
  if (x1 <= x0 || y1 <= y0) return false;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (sample(a, bboxA, x, y) === 255 && sample(b, bboxB, x, y) === 255)
        return true;
    }
  }
  return false;
};

export type SetOperation = "union" | "intersection" | "difference";

const BINARY_OPS = {
  union,
  intersection,
  difference,
} as const;

/**
 * Apply `op` left-to-right from the first operand, which is the one that
 * survives a commit. For `difference` that makes the first operand the minuend
 * and every later one a subtrahend, so operand order needs no separate UI.
 *
 * Returns null as soon as the accumulator empties — an intersection that stops
 * overlapping, or a difference that erases itself, cannot be commited.
 */
export const foldOperands = (
  op: SetOperation,
  operands: MaskRegion[],
): MaskRegion | null => {
  if (operands.length === 0) return null;
  return operands
    .slice(1)
    .reduce<MaskRegion | null>(
      (acc, next) =>
        acc && BINARY_OPS[op](acc.mask, acc.bbox, next.mask, next.bbox),
      operands[0],
    );
};
