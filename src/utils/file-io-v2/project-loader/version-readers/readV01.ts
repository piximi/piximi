import { openGroup } from "zarr";

import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";

import { Partition } from "utils/modelsV2/enums";

import { ZARR_V01_IMAGE } from "../zarr/types";
import {
  getAttr,
  getDataset,
  getDatasetSelection,
  getGroup,
} from "../zarr/utils";
import {
  deserializeColorsRaw,
  deserializeSegmenterGroup,
  v01_02_deserializeClassifierGroup,
} from "./common";
import { subProgress } from "../progress";

import type { CustomStore } from "../zarr/stores";
import type {
  V01BitDepth,
  V01RawAnnotationObject,
  V01Category,
  V01RawImageObject,
  V01PiximiState,
} from "./version-types/v01Types";
import type { RawArray } from "zarr/types/rawArray";
import type { Group } from "zarr";

const STAGES = {
  metadata: { start: 0.0, end: 0.05 },
  images: { start: 0.05, end: 0.425 },
  annotations: { start: 0.425, end: 0.8 },
  categories: { start: 0.8, end: 0.9 },
  models: { start: 0.9, end: 1.0 },
} as const;

// ============================================================
// Public reader
// ============================================================

export async function readV01(
  store: CustomStore,
  onProgress: (p: number) => void,
): Promise<V01PiximiState> {
  const rootGroup = await openGroup(store, store.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");

  const projectName = (await getAttr(projectGroup, "name")) as string;
  onProgress(STAGES.metadata.end);

  // --- Images ---
  const imagesGroup = await getGroup(projectGroup, "images");
  const imageNames = (await getAttr(
    imagesGroup,
    ZARR_V01_IMAGE.ImageNames,
  )) as string[];
  const images: V01RawImageObject[] = [];

  const imageProgress = subProgress(onProgress, STAGES.images);

  for (const [i, name] of Object.entries(imageNames)) {
    const imageGroup = await getGroup(imagesGroup, name);
    const image = await deserializeImageGroup(name, imageGroup);
    images.push(image);
    imageProgress(+i / images.length);
  }

  // --- Annotations ---
  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(
    annotationsGroup,
    subProgress(onProgress, STAGES.annotations),
  );

  // --- Categories ---
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);
  const annotationCategoriesGroup = await getGroup(
    projectGroup,
    "annotationCategories",
  );

  const annotationCategories = await deserializeCategoriesGroup(
    annotationCategoriesGroup,
  );
  onProgress(STAGES.categories.end);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v01_02_deserializeClassifierGroup(classifierGroup);
  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  onProgress(STAGES.models.end);

  return {
    project: {
      name: projectName,
      imageChannels: images[0]?.shape.channels,
    },
    classifier,
    segmenter,
    data: { images, annotations, categories, annotationCategories },
  };
}

// ============================================================
// Image deserialization
// ============================================================

async function deserializeImageGroup(
  name: string,
  imageGroup: Group,
): Promise<V01RawImageObject> {
  const id = (await getAttr(imageGroup, ZARR_V01_IMAGE.ImageId)) as string;
  const activePlane = (await getAttr(
    imageGroup,
    ZARR_V01_IMAGE.ActivePlane,
  )) as number;
  const categoryId = (await getAttr(
    imageGroup,
    ZARR_V01_IMAGE.ClassCategoryId,
  )) as string;

  const colorsGroup = await getGroup(imageGroup, "colors");
  const colors = await deserializeColorsRaw(colorsGroup);

  const imageDataset = await getDataset(imageGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const [planes, height, width, channels] = imageRawArray.shape;
  const bitDepth = (await getAttr(
    imageDataset,
    ZARR_V01_IMAGE.BitDepth,
  )) as V01BitDepth;

  return {
    id,
    name,
    activePlane,
    categoryId,
    partition:
      categoryId === UNKNOWN_IMAGE_CATEGORY_ID
        ? Partition.Inference
        : Partition.Unassigned,
    colors,
    bitDepth,
    shape: { planes, height, width, channels },
    tensorData: {
      buffer: (imageRawArray.data as Float32Array).buffer as ArrayBuffer,
      dtype: "float32",
      shape: [planes, height, width, channels],
    },
  };
}

// ============================================================
// Annotation deserialization
// ============================================================

/**
 * Deserialize v0.1 annotations from flat parallel arrays.
 *
 * The v0.1 format stores all annotations in a single group with parallel
 * datasets rather than individual subgroups:
 *   - annotation_id: string[]     — one per annotation
 *   - annotation_category_id: string[] — one per annotation
 *   - image_id: string[]          — one per annotation
 *   - bounding_box: Uint8Array    — 4 values per annotation (flat, stride 4)
 *   - mask: Uint8Array            — variable-length RLE per annotation (flat)
 *   - mask_length: Uint8Array     — one per annotation (how many values in mask)
 *   - plane: Uint8Array           — one per annotation
 */
async function deserializeAnnotationsGroup(
  _annotationsGroup: Group,
  onProgress: (p: number) => void,
): Promise<V01RawAnnotationObject[]> {
  const imageIds = (await getAttr(_annotationsGroup, "image_id")) as string[];

  const categories = (await getAttr(
    _annotationsGroup,
    "annotation_category_id",
  )) as string[];

  const ids = (await getAttr(_annotationsGroup, "annotation_id")) as string[];

  const bboxes = await getDatasetSelection(_annotationsGroup, "bounding_box", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const maskLengths = await getDatasetSelection(
    _annotationsGroup,
    "mask_length",
    [null],
  ).then((ra) => ra.data as Uint8Array);

  const masks = await getDatasetSelection(_annotationsGroup, "mask", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const planes = await getDatasetSelection(_annotationsGroup, "plane", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const annotations: Array<V01RawAnnotationObject> = [];
  let bboxIdx = 0;
  let maskIdx = 0;
  for (let i = 0; i < ids.length; i++) {
    annotations.push({
      id: ids[i],
      categoryId: categories[i],
      plane: planes[i],
      boundingBox: Array.from(bboxes.slice(bboxIdx, bboxIdx + 4)) as [
        number,
        number,
        number,
        number,
      ],
      encodedMask: Array.from(masks.slice(maskIdx, maskIdx + maskLengths[i])),
      imageId: imageIds[i],
    });

    bboxIdx += 4;
    maskIdx += maskLengths[i];
    onProgress(i / ids.length);
  }

  return annotations;
}

// ============================================================
// Category deserialization
// ============================================================

async function deserializeCategoriesGroup(
  categoriesGroup: Group,
): Promise<V01Category[]> {
  const ids = (await getAttr(categoriesGroup, "category_id")) as string[];
  const colors = (await getAttr(categoriesGroup, "color")) as string[];
  const names = (await getAttr(categoriesGroup, "name")) as string[];

  return ids.map((id, i) => ({
    id,
    color: colors[i],
    name: names[i],
    visible: true,
  }));
}
