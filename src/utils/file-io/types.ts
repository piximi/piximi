import * as T from "io-ts";
import * as ImageJS from "image-js";
import {
  SerializedAnnotationRType,
  SerializedAnnotationRTypeV2,
  SerializedCOCOAnnotationRType,
  SerializedCOCOCategoryRType,
  SerializedCOCOFileRType,
  SerializedCOCOImageRType,
  SerializedFileRType,
  SerializedFileRTypeV2,
  SerializedImageRType,
} from "./runtimeTypes";
import { MIMETYPES } from "./constants";
import { ImageShapeEnum } from "./enums";

export type SerializedCOCOAnnotationType = T.TypeOf<
  typeof SerializedCOCOAnnotationRType
>;

export type SerializedCOCOCategoryType = T.TypeOf<
  typeof SerializedCOCOCategoryRType
>;
export type SerializedAnnotatorImageType = T.TypeOf<
  typeof SerializedImageRType
>;

export type SerializedCOCOImageType = T.TypeOf<typeof SerializedCOCOImageRType>;

export type SerializedCOCOFileType = T.TypeOf<typeof SerializedCOCOFileRType>;

export type SerializedFileType = T.TypeOf<typeof SerializedFileRType>;
export type SerializedFileTypeV2 = T.TypeOf<typeof SerializedFileRTypeV2>;
export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;

export type NewSerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRTypeV2
>;

export type ImageFileType = {
  fileName: string;
  imageStack: ImageJS.Stack;
};

export type ImageFileError = {
  fileName: string;
  error: string;
};

export type MIMEType = (typeof MIMETYPES)[number];

export type BitDepth = ImageJS.BitDepth;

export type DataArray = ImageJS.DataArray;

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: BitDepth;
  components?: number;
  alpha?: boolean;
}

export interface ImageFileShapeInfo extends ImageShapeInfo {
  ext: MIMEType;
}

export type LoadCB = (laodPercent: number, loadMessage: string) => void;
