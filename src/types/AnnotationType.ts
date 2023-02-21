import { DataArray } from "utils/common/image";

export type encodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
};
export type decodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  maskData: DataArray;
  plane: number;
};
