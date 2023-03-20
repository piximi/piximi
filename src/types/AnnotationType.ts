import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray } from "utils/common/image";

export type EncodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  mask: Array<number>;
  plane: number;
  data?: Tensor4D;
  imageId?: string;
  src?: string;
};
export type DecodedAnnotationType = {
  // x1, y1, W, H
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  maskData: DataArray;
  plane: number;
};
