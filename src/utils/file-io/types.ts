import { TypeOf as IOTSTypeOf } from "io-ts";
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

export type MIMEType = (typeof MIMETYPES)[keyof typeof MIMETYPES];
