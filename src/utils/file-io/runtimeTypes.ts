import * as T from "io-ts";
import { getOrElseW } from "fp-ts/Either";
import { failure } from "io-ts/PathReporter";
import { logger } from "utils/common/helpers";

//#region COCO Serialization Type

const SerializedCOCOInfoRtype = T.type({
  year: T.Integer,
  version: T.string,
  description: T.string,
  contributor: T.string,
  url: T.string,
  date_created: T.string,
});

export const SerializedCOCOImageRType = T.type({
  id: T.Integer,
  width: T.Integer,
  height: T.Integer,
  file_name: T.string,
  license: T.Integer,
  flickr_url: T.string,
  coco_url: T.string,
  date_captured: T.string,
});

const SerializedCOCOLicenseRType = T.type({
  id: T.Integer,
  name: T.string,
  url: T.string,
});

// when iscrowd is true
const SerializedCOCORLERType = T.type({
  size: T.tuple([T.number, T.number]),
  counts: T.array(T.Integer),
});

// when iscrowd is false
const SerializedCOCOPolygonRType = T.array(T.array(T.number));

export const SerializedCOCOAnnotationRType = T.type({
  id: T.Integer,
  image_id: T.Integer,
  category_id: T.Integer,
  segmentation: T.union([SerializedCOCOPolygonRType, SerializedCOCORLERType]),
  area: T.number,
  // x, y, width, height
  bbox: T.tuple([T.number, T.number, T.number, T.number]),
  iscrowd: T.union([T.literal(0), T.literal(1)]),
});

export const SerializedCOCOCategoryRType = T.type({
  id: T.Integer,
  name: T.string,
  supercategory: T.string,
});

export const SerializedCOCOFileRType = T.type({
  info: SerializedCOCOInfoRtype,
  images: T.array(SerializedCOCOImageRType),
  annotations: T.array(SerializedCOCOAnnotationRType),
  licenses: T.array(SerializedCOCOLicenseRType),
  categories: T.array(SerializedCOCOCategoryRType),
});

//#endregion COCO Serialization Type

//#region Basic Serialization Type

const SerializedCategoryRType = T.type({
  id: T.string,
  color: T.string, // 3 byte hex, eg "#a08cd2"
  name: T.string,
  visible: T.boolean,
});
const SerializedCategoryRTypeV2 = T.type({
  id: T.string,
  color: T.string, // 3 byte hex, eg "#a08cd2"
  name: T.string,
  visible: T.boolean,
  containing: T.array(T.string),
  kind: T.string,
});
const SerializedKindRType = T.type({
  id: T.string,
  categories: T.array(T.string), // 3 byte hex, eg "#a08cd2"
  unknownCategoryId: T.string,
  containing: T.array(T.string),
});

export const SerializedImageRType = T.type({
  id: T.string,
  name: T.string,
});

export const SerializedAnnotationRType = T.type({
  categoryId: T.string, // category id, matching id of a SerializedCategory
  imageId: T.string, // image id, matching id of SerializedImage
  id: T.string,
  mask: T.string, // e.g. "114 1 66 1 66 2 ..."
  plane: T.number,
  boundingBox: T.array(T.number), // [x1, y1, x2, y2]
});

export const SerializedAnnotationRTypeV2 = T.type({
  categoryId: T.string, // category id, matching id of a SerializedCategory
  imageId: T.string, // image id, matching id of SerializedImage
  name: T.string,
  id: T.string,
  mask: T.string, // e.g. "114 1 66 1 66 2 ..."
  activePlane: T.number,
  boundingBox: T.array(T.number), // [x1, y1, x2, y2]
  kind: T.string,
  partition: T.string,
  shape: T.array(T.number),
});

export const SerializedFileRType = T.type({
  categories: T.array(SerializedCategoryRType),
  annotations: T.array(SerializedAnnotationRType),
  images: T.array(SerializedImageRType),
});
export const SerializedFileRTypeV2 = T.type({
  categories: T.array(SerializedCategoryRTypeV2),
  annotations: T.array(SerializedAnnotationRTypeV2),
  images: T.array(SerializedImageRType),
  kinds: T.array(SerializedKindRType),
  version: T.string,
});

//#endregion Basic Serialization Type

const toError = (errors: any) => {
  process.env.NODE_ENV !== "production" && logger(errors);
  throw new Error(failure(errors).join("\n"));
};

export enum ProjectFileType {
  COCO,
  PIXIMI,
}

export const validateFileType = (
  encodedFileContents: string,
  projectType: ProjectFileType = ProjectFileType.PIXIMI
) => {
  const annotations = JSON.parse(encodedFileContents);
  switch (projectType) {
    case ProjectFileType.PIXIMI:
      return getOrElseW(toError)(SerializedFileRType.decode(annotations));
    case ProjectFileType.COCO:
      return getOrElseW(toError)(SerializedCOCOFileRType.decode(annotations));
    default:
      throw new Error("Unrecognized project type", projectType);
  }
};
