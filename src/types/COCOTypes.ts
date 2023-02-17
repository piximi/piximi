import * as T from "io-ts";
import {
  SerializedCOCOFileRType,
  SerializedCOCOAnnotationRType,
  SerializedCOCOCategoryRType,
  SerializedCOCOImageRType,
} from "./runtime";

export type SerializedCOCOAnnotationType = T.TypeOf<
  typeof SerializedCOCOAnnotationRType
>;

export type SerializedCOCOCategoryType = T.TypeOf<
  typeof SerializedCOCOCategoryRType
>;

export type SerializedCOCOImageType = T.TypeOf<typeof SerializedCOCOImageRType>;

export type SerializedCOCOFileType = T.TypeOf<typeof SerializedCOCOFileRType>;
