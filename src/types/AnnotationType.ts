import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray } from "utils/common/image";
import * as T from "io-ts";
import { SerializedAnnotationRType } from "./runtime";

export type AnnotationType = {
  // x1, y1, x_2, y_2
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  encodedMask?: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  data?: Tensor4D;
  imageId?: string;
  src?: string;
};
export type DecodedAnnotationType = AnnotationType & { decodedMask: DataArray };
export type EncodedAnnotationType = AnnotationType & {
  encodedMask: Array<number>;
};

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;
