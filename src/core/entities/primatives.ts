import type { BitDepth as IJSBitDepth } from "image-js-latest";

export type BitDepth = IJSBitDepth;
export type DataArray = Uint8Array | Uint16Array;

export const DTYPES = {
  UINT8: "uint8",
  INT32: "int32",
  FLOAT32: "float32",
} as const;

export type DType = (typeof DTYPES)[keyof typeof DTYPES];

export type Shape = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type ShapeArray = [number, number, number, number];

export type ColorMap = [number, number, number];

// BBox = [x1, y1, x2, y2]
export type BBox = [number, number, number, number];
