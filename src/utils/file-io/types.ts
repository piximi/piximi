import { TypeOf as IOTSTypeOf } from "io-ts";
import { Stack as IJSStack } from "image-js";
import {
  SerializedAnnotationRType,
  SerializedAnnotationRTypeV02,
  SerializedCOCOAnnotationRType,
  SerializedCOCOCategoryRType,
  SerializedCOCOFileRType,
  SerializedCOCOImageRType,
  SerializedFileRType,
  SerializedFileRTypeV02,
  SerializedImageRType,
} from "./runtime/runtimeTypes";
import { MIMETYPES } from "./enums";
import { ImageShapeEnum } from "./enums";

import { BitDepth } from "store/data/types";

export type SerializedCOCOAnnotationType = IOTSTypeOf<
  typeof SerializedCOCOAnnotationRType
>;

export type SerializedCOCOCategoryType = IOTSTypeOf<
  typeof SerializedCOCOCategoryRType
>;
export type SerializedAnnotatorImageType = IOTSTypeOf<
  typeof SerializedImageRType
>;

export type SerializedCOCOImageType = IOTSTypeOf<
  typeof SerializedCOCOImageRType
>;

export type SerializedCOCOFileType = IOTSTypeOf<typeof SerializedCOCOFileRType>;

export type SerializedFileType = IOTSTypeOf<typeof SerializedFileRType>;
export type SerializedFileTypeV02 = IOTSTypeOf<typeof SerializedFileRTypeV02>;
export type SerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRType
>;

export type NewSerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRTypeV02
>;

export type ImageFileType = {
  fileName: string;
  imageStack: IJSStack;
};

export type ImageFileError = {
  fileName: string;
  error: string;
};

export type MIMEType = (typeof MIMETYPES)[keyof typeof MIMETYPES];

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: BitDepth;
  components?: number;
  alpha?: boolean;
}

export interface ImageFileShapeInfo extends ImageShapeInfo {
  ext: MIMEType;
}
