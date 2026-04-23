import {
  UNKNOWN_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/dataV2/constants";
import { generateUUID } from "store/dataV2/utils";
import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";

import { Partition } from "utils/models/enums";
import { representsUnknown } from "utils/stringUtils";

import { subProgress } from "../progress";

import type {
  V01Category,
  V01PiximiState,
  V01RawImageObject,
} from "../version-readers/version-types/v01Types";
import type {
  V02Category,
  V02Kind,
  V02PiximiState,
  V02RawAnnotationObject,
  V02RawImageObject,
} from "../version-readers/version-types/v02Types";

const STAGES = {
  labels: { start: 0.0, end: 0.2 },
  images: { start: 0.2, end: 0.6 },
  annotations: { start: 0.6, end: 1 },
} as const;
/**
 * Convert v0.1 project data to v0.2 format.
 *
 * Key transformations:
 * - Creates Kind entities (IMAGE_KIND + one per annotation category)
 * - Maps flat category structure to kind→categories hierarchy
 * - Unifies images and annotations into "things" array
 * - Adds "kind", "containing" fields to images
 * - Adds "name", "kind", "shape", "partition", "bitDepth" to annotations
 * - Creates "Unknown" category per kind
 *
 */
export function convertV01ToV02(
  v01: V01PiximiState,
  onProgress: (p: number) => void,
): V02PiximiState {
  const v02Data = v01_02_dataConverter(v01.data, onProgress);
  return {
    project: v01.project,
    classifier: v01.classifier,
    segmenter: v01.segmenter,
    data: v02Data,
  };
}

const v01_02_dataConverter = (
  data: V01PiximiState["data"],
  onProgress: (p: number) => void,
): V02PiximiState["data"] => {
  const {
    images,
    categories: oldCategories,
    annotationCategories,
    annotations,
  } = data;

  const things: V02PiximiState["data"]["things"] = {
    ids: [],
    entities: {},
  };

  // Create Kind Entity State
  const kinds: V02PiximiState["data"]["kinds"] = { ids: [], entities: {} };
  // Add IMAGE_KIND Kind
  const { kind: imageKind, unknownCategory: unknownImageCategory } =
    v02GenerateKind("Image");

  kinds.ids.push(imageKind.id);
  kinds.entities[imageKind.id] = {
    ...imageKind,
  };

  // Create Categories Entity State
  const categories: V02PiximiState["data"]["categories"] = {
    ids: [],
    entities: {},
  };

  // Add new "Unknown" image category
  categories.ids.push(unknownImageCategory.id);
  categories.entities[unknownImageCategory.id] = {
    ...unknownImageCategory,
    containing: [],
  };

  const nonUnknownCategoryMap = convertCategories(
    oldCategories,
    categories,
    kinds,
  );
  onProgress(STAGES.labels.end);

  convertImages(
    images,
    imageKind,
    unknownImageCategory,
    nonUnknownCategoryMap,
    things,
    categories,
    subProgress(onProgress, STAGES.images),
  );

  const annCatNameMap = convertAnnotationCategories(
    annotationCategories,
    kinds,
    categories,
  );

  const numAnnotationsOfKindPerImage: Record<string, number> = {};
  const annotationProgress = subProgress(onProgress, STAGES.annotations);
  let i = 0;
  for (const v01Annotation of annotations) {
    const annotationKind =
      kinds.entities[annCatNameMap[v01Annotation.categoryId]];
    const unknownCategoryId = annotationKind.unknownCategoryId;

    if (!(v01Annotation.imageId in things.entities))
      throw new Error("Error converting project file");

    const image = things.entities[v01Annotation.imageId] as V02RawImageObject;
    let annotationName = `${image.name}-${annotationKind.displayName}`;
    image.containing.push(v01Annotation.id);

    if (annotationName in numAnnotationsOfKindPerImage) {
      annotationName += `_${numAnnotationsOfKindPerImage[annotationName]++}`;
    } else {
      numAnnotationsOfKindPerImage[annotationName] = 1;
      annotationName += "_0";
    }

    const { crop, shape } = cropImageBuffer(v01Annotation.boundingBox, image);

    const v02Annotation: V02RawAnnotationObject = {
      ...v01Annotation,
      name: annotationName,
      categoryId: unknownCategoryId,
      kind: annotationKind.id,
      partition: Partition.Unassigned,
      bitDepth: image.bitDepth,
      activePlane: 0,
      plane: 0,
      shape: {
        planes: shape[0],
        width: shape[1],
        height: shape[2],
        channels: shape[3],
      },
      tensorData: {
        buffer: crop.buffer as ArrayBuffer,
        dtype: "float32",
        shape,
      },
    };

    things.ids.push(v02Annotation.id);

    things.entities[v02Annotation.id] = v02Annotation;

    annotationKind.containing.push(v02Annotation.id);

    categories.entities[unknownCategoryId]!.containing.push(v02Annotation.id);
    annotationProgress(i / annotations.length);
    i++;
  }

  return { kinds, categories, things };
};

export const v02GenerateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = v02GenerateUnknownCategory(kindId);
  const kind: V02Kind = {
    id: kindId,
    displayName: kindName,
    unknownCategoryId: unknownCategory.id,
    categories: [unknownCategory.id],
    containing: [],
  };
  return { kind, unknownCategory };
};
export const v02GenerateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: V02Category = {
    id: unknownCategoryId,
    name: UNKNOWN_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    kind: kind,
    visible: true,
    containing: [],
  };
  return unknownCategory;
};
function convertCategories(
  oldCategories: V01Category[],
  newCategories: V02PiximiState["data"]["categories"],
  newKinds: V02PiximiState["data"]["kinds"],
): Record<string, string> {
  const nonUnknownCategoryMap: Record<string, string> = {};
  for (const category of oldCategories) {
    if (category.id === UNKNOWN_IMAGE_CATEGORY_ID) {
      continue;
    } else {
      let catId: string = category.id;
      // Check if id starts with "0", which indicates an unknown category in the new project version
      // If it does, replace with "1" and add to the mapping
      if (representsUnknown(catId)) {
        catId = "1" + category.id.slice(1);
        nonUnknownCategoryMap[category.id] = catId;
      }

      // create and add category to Entity State
      newCategories.ids.push(catId);
      newCategories.entities[catId] = {
        ...category,
        id: catId,
        kind: "Image",
        containing: [],
      };

      newKinds.entities["Image"].categories.push(catId);
    }
  }
  return nonUnknownCategoryMap;
}

function convertImages(
  images: V01RawImageObject[],
  imageKind: V02Kind,
  unknownImageCategory: V02Category,
  nonUnknownCategoryMap: Record<string, string>,
  newThings: V02PiximiState["data"]["things"],
  categories: V02PiximiState["data"]["categories"],
  onProgress: (p: number) => void,
) {
  let i = 0;
  for (const image of images) {
    image.kind = imageKind.id;
    imageKind.containing.push(image.id);
    let cat: string;
    if (image.categoryId === UNKNOWN_IMAGE_CATEGORY_ID) {
      cat = unknownImageCategory.id;
    } else {
      cat = nonUnknownCategoryMap[image.categoryId] ?? image.categoryId;
    }
    image.categoryId = cat;
    image.containing = [];

    newThings.ids.push(image.id);

    newThings.entities[image.id] = image as V02RawImageObject;
    if (cat in categories.entities) {
      categories.entities[cat]!.containing.push(image.id);
    }
    onProgress(i / images.length);
    i++;
  }
}

function convertAnnotationCategories(
  annotationCategories: V01Category[],
  newKinds: V02PiximiState["data"]["kinds"],
  newCategories: V02PiximiState["data"]["categories"],
) {
  const annCatNameMap: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    if (anCat.id === UNKNOWN_ANNOTATION_CATEGORY_ID) continue;

    const { kind: anKind, unknownCategory } = v02GenerateKind(anCat.name);
    newKinds.ids.push(anKind.id);

    newKinds.entities[anKind.id] = anKind;
    newCategories.ids.push(unknownCategory.id);
    newCategories.entities[unknownCategory.id] = {
      ...unknownCategory,
      containing: [],
    };
    annCatNameMap[anCat.id] = anCat.name;
  }
  return annCatNameMap;
}

function cropImageBuffer(
  boundingBox: [number, number, number, number],
  image: V01RawImageObject,
): { crop: Float32Array; shape: [number, number, number, number] } {
  const src = new Float32Array(image.tensorData.buffer);
  const { height, width, channels, planes } = image.shape;
  // For each plane z, copy rows y1..y2, within each row copy cols x1..x2 (all channels)
  const [x1, y1, x2, y2] = boundingBox;
  const cropH = y2 - y1;
  const cropW = x2 - x1;
  const cropSize = planes * cropH * cropW * channels;
  const crop = new Float32Array(cropSize);

  let outIdx = 0;
  for (let z = 0; z < planes; z++) {
    for (let h = y1; h < y2; h++) {
      const rowStart = (z * height * width + h * width + x1) * channels;
      const rowEnd = rowStart + cropW * channels;
      crop.set(src.subarray(rowStart, rowEnd), outIdx);
      outIdx += cropW * channels;
    }
  }
  return { crop, shape: [planes, width, height, channels] };
}
