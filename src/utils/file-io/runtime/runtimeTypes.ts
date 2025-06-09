import {
  Integer as IOTSInteger,
  string as IOTSString,
  number as IOTSNumber,
  type as IOTSType,
  array as IOTSArray,
  tuple as IOTSTuple,
  union as IOTSUnion,
  literal as IOTSLiteral,
  boolean as IOTSBoolean,
  record as IOTSRecord,
} from "io-ts";

import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { enumToCodec } from "./runtimeUtils";

//#region COCO Serialization Type

const SerializedCOCOInfoRtype = IOTSType({
  year: IOTSInteger,
  version: IOTSString,
  description: IOTSString,
  contributor: IOTSString,
  url: IOTSString,
  date_created: IOTSString,
});

export const SerializedCOCOImageRType = IOTSType({
  id: IOTSInteger,
  width: IOTSInteger,
  height: IOTSInteger,
  file_name: IOTSString,
  license: IOTSInteger,
  flickr_url: IOTSString,
  coco_url: IOTSString,
  date_captured: IOTSString,
});

const SerializedCOCOLicenseRType = IOTSType({
  id: IOTSInteger,
  name: IOTSString,
  url: IOTSString,
});

// when iscrowd is true
const SerializedCOCORLERType = IOTSType({
  size: IOTSTuple([IOTSNumber, IOTSNumber]),
  counts: IOTSArray(IOTSInteger),
});

// when iscrowd is false
const SerializedCOCOPolygonRType = IOTSArray(IOTSArray(IOTSNumber));

export const SerializedCOCOAnnotationRType = IOTSType({
  id: IOTSInteger,
  image_id: IOTSInteger,
  category_id: IOTSInteger,
  segmentation: IOTSUnion([SerializedCOCOPolygonRType, SerializedCOCORLERType]),
  area: IOTSNumber,
  // x, y, width, height
  bbox: IOTSTuple([IOTSNumber, IOTSNumber, IOTSNumber, IOTSNumber]),
  iscrowd: IOTSUnion([IOTSLiteral(0), IOTSLiteral(1)]),
});

export const SerializedCOCOCategoryRType = IOTSType({
  id: IOTSInteger,
  name: IOTSString,
  supercategory: IOTSString,
});

export const SerializedCOCOFileRType = IOTSType({
  info: SerializedCOCOInfoRtype,
  images: IOTSArray(SerializedCOCOImageRType),
  annotations: IOTSArray(SerializedCOCOAnnotationRType),
  licenses: IOTSArray(SerializedCOCOLicenseRType),
  categories: IOTSArray(SerializedCOCOCategoryRType),
});

//#endregion COCO Serialization Type

//#region Basic Serialization Type

const SerializedCategoryRType = IOTSType({
  id: IOTSString,
  color: IOTSString, // 3 byte hex, eg "#a08cd2"
  name: IOTSString,
  visible: IOTSBoolean,
});
const V02_SerializedCategoryRType = IOTSType({
  id: IOTSString,
  color: IOTSString, // 3 byte hex, eg "#a08cd2"
  name: IOTSString,
  visible: IOTSBoolean,
  containing: IOTSArray(IOTSString),
  kind: IOTSString,
});
const SerializedKindRType = IOTSType({
  id: IOTSString,
  displayName: IOTSString,
  categories: IOTSArray(IOTSString), // 3 byte hex, eg "#a08cd2"
  unknownCategoryId: IOTSString,
  containing: IOTSArray(IOTSString),
});

export const SerializedImageRType = IOTSType({
  id: IOTSString,
  name: IOTSString,
});

export const SerializedAnnotationRType = IOTSType({
  categoryId: IOTSString, // category id, matching id of a SerializedCategory
  imageId: IOTSString, // image id, matching id of SerializedImage
  id: IOTSString,
  mask: IOTSString, // e.g. "114 1 66 1 66 2 ..."
  plane: IOTSNumber,
  boundingBox: IOTSArray(IOTSNumber), // [x1, y1, x2, y2]
});

export const V02_SerializedAnnotationRType = IOTSType({
  categoryId: IOTSString, // category id, matching id of a SerializedCategory
  imageId: IOTSString, // image id, matching id of SerializedImage
  name: IOTSString,
  id: IOTSString,
  mask: IOTSString, // e.g. "114 1 66 1 66 2 ..."
  activePlane: IOTSNumber,
  boundingBox: IOTSArray(IOTSNumber), // [x1, y1, x2, y2]
  kind: IOTSString,
  partition: IOTSString,
  shape: IOTSArray(IOTSNumber),
});

export const SerializedFileRType = IOTSType({
  categories: IOTSArray(SerializedCategoryRType),
  annotations: IOTSArray(SerializedAnnotationRType),
  images: IOTSArray(SerializedImageRType),
});
export const V02_SerializedFileRType = IOTSType({
  categories: IOTSArray(V02_SerializedCategoryRType),
  annotations: IOTSArray(V02_SerializedAnnotationRType),
  images: IOTSArray(SerializedImageRType),
  kinds: IOTSArray(SerializedKindRType),
  version: IOTSString,
});

export const SerializedModelMetadataRType = IOTSType({
  preprocessSettings: IOTSType({
    cropSchema: enumToCodec(CropSchema),
    numCrops: IOTSNumber,
    inputShape: IOTSType({
      width: IOTSNumber,
      height: IOTSNumber,
      channels: IOTSNumber,
    }),
    shuffle: IOTSBoolean,
    rescale: IOTSBoolean,
    batchSize: IOTSNumber,
  }),
  classes: IOTSArray(IOTSString),
  optimizerSettings: IOTSType({
    learningRate: IOTSNumber,
    lossFunction: IOTSUnion([
      enumToCodec(LossFunction),
      IOTSArray(enumToCodec(LossFunction)),
      IOTSRecord(IOTSString, enumToCodec(LossFunction)),
    ]),
    metrics: IOTSArray(enumToCodec(Metric)),
    optimizationAlgorithm: enumToCodec(OptimizationAlgorithm),
    epochs: IOTSNumber,
    batchSize: IOTSNumber,
  }),
});

//#endregion Basic Serialization Type
