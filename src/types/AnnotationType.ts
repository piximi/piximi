import { DataArray } from "utils/common/image";

export type EncodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
};
export type DecodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  maskData: DataArray;
  plane: number;
};
