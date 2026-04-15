import { Group, openGroup } from "zarr";
import { RawArray } from "zarr/types/rawArray";

import {
  getAttr,
  getDataset,
  getDatasetSelection,
  getGroup,
} from "../zarr/utils";
import { ZARR_V01_IMAGE } from "../zarr/types";

import { initialState as initialProjectState } from "store/project/projectSlice";
import { BitDepth } from "store/data/types";
import { Partition } from "utils/models/enums";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";
import { CustomStore } from "utils/file-io/zarr/stores";
import {
  V01RawAnnotationObject,
  V01Category,
  V01RawImageObject,
  V01PiximiState,
} from "./version-types/v01Types";
import {
  deserializeColorsRaw,
  deserializeSegmenterGroup,
  v01_02_deserializeClassifierGroup,
} from "./common";

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
  )) as BitDepth;

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

// ============================================================
// Public reader
// ============================================================

export async function readV01(
  store: CustomStore,
  onProgress: (progress: number) => void,
): Promise<V01PiximiState> {
  const rootGroup = await openGroup(store, store.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");

  const projectName = (await getAttr(projectGroup, "name")) as string;
  onProgress(11);

  // --- Images ---
  const imagesGroup = await getGroup(projectGroup, "images");
  const imageNames = (await getAttr(
    imagesGroup,
    ZARR_V01_IMAGE.ImageNames,
  )) as string[];
  const images: V01RawImageObject[] = [];

  for (const [i, name] of Object.entries(imageNames)) {
    const imageGroup = await getGroup(imagesGroup, name);
    const image = await deserializeImageGroup(name, imageGroup);
    images.push(image);
    onProgress(11 + Math.floor((+i / imageNames.length) * 49));
  }
  onProgress(50);

  // --- Annotations ---
  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(annotationsGroup);
  onProgress(75);

  // --- Categories ---
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);
  const annotationCategoriesGroup = await getGroup(
    projectGroup,
    "annotationCategories",
  );
  onProgress(80);
  const annotationCategories = await deserializeCategoriesGroup(
    annotationCategoriesGroup,
  );
  onProgress(90);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v01_02_deserializeClassifierGroup(classifierGroup);
  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  onProgress(100);

  return {
    project: {
      ...initialProjectState,
      name: projectName,
      imageChannels: images[0]?.shape.channels,
    },
    classifier,
    segmenter,
    data: { images, annotations, categories, annotationCategories },
  };
}
