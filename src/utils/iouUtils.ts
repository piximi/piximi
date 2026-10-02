import { decodeRleArray } from "./image";

import type { BBox } from "core/entities";

export const DUPLICATE_IOU_THRESHOLD = 0.5;

export type MaskedBox = { boundingBox: BBox; encodedMask: Array<number> };
export type MaskDecoder = (m: MaskedBox) => Uint8ClampedArray;

const decodeBinary: MaskDecoder = (m) => decodeRleArray(m.encodedMask, true);

/**
 * Foreground pixel count of a run-length encoded mask.
 * Runs alternate background/foreground starting with background,
 * so the foreground runs are the odd indices.
 */
export const rleArea = (encoded: Array<number>): number => {
  let area = 0;
  for (let i = 1; i < encoded.length; i += 2) area += encoded[i];
  return area;
};

/**
 * Pixel IoU of two bbox-cropped RLE masks in image coordinates.
 * Pairs whose bboxes do not intersect return 0 without decoding.
 */
export const maskIoU = (
  a: MaskedBox,
  b: MaskedBox,
  decode: MaskDecoder = decodeBinary,
): number => {
  const [ax1, ay1, ax2, ay2] = a.boundingBox;
  const [bx1, by1, bx2, by2] = b.boundingBox;
  const ix1 = Math.max(ax1, bx1);
  const iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  if (ix2 <= ix1 || iy2 <= iy1) return 0;

  const aMask = decode(a);
  const bMask = decode(b);
  const aW = ax2 - ax1;
  const bW = bx2 - bx1;

  let intersection = 0;
  for (let y = iy1; y < iy2; y++) {
    for (let x = ix1; x < ix2; x++) {
      if (
        aMask[(y - ay1) * aW + (x - ax1)] &&
        bMask[(y - by1) * bW + (x - bx1)]
      )
        intersection++;
    }
  }

  const union = rleArea(a.encodedMask) + rleArea(b.encodedMask) - intersection;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Wrap a decoder so each mask object is decoded at most once.
 * Keyed by object identity; create one per image so the cache is short-lived.
 */
export const createCachedDecoder = (
  decode: MaskDecoder = decodeBinary,
): MaskDecoder => {
  const cache = new WeakMap<MaskedBox, Uint8ClampedArray>();
  return (m) => {
    let decoded = cache.get(m);
    if (!decoded) {
      decoded = decode(m);
      cache.set(m, decoded);
    }
    return decoded;
  };
};

export const isDuplicate = (
  candidate: MaskedBox,
  existing: Array<MaskedBox>,
  decode: MaskDecoder = decodeBinary,
): boolean =>
  existing.some(
    (e) => maskIoU(candidate, e, decode) >= DUPLICATE_IOU_THRESHOLD,
  );
