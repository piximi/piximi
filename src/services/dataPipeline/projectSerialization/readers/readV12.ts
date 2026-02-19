import { Group, openGroup } from "zarr";
import { RawArray } from "zarr/types/rawArray";

import { getAttr, getDataset, getGroup } from "../zarr/utils";
import {
  ZARR_METADATA_GROUP,
  ZARR_IMAGE_GROUP,
  ZARR_ANNOTATION_GROUP,
  ZARR_CATEGORY_GROUP,
  ZARR_KIND_GROUP,
} from "../zarr/types";

import { initialState as initialProjectState } from "store/project/projectSlice";
import { BitDepth, Shape } from "store/data/types";
import { Partition } from "utils/models/enums";
import { generateDataRelationships } from "store/data/utils";
import { CustomStore } from "utils/file-io/zarr/stores";
import {
  V12RawAnnotationObject,
  V12Category,
  V12ImageMetadata,
  V12RawImageObject,
  V12Kind,
  V12PiximiState,
} from "./version-types/v12Types";
import {
  deserializeColorsRaw,
  deserializeSegmenterGroup,
  v11_v12_deserializeClassifierGroup,
} from "./common";

// ============================================================
// Public reader function
// ============================================================

export async function readV12(
  store: CustomStore,
  onProgress: (progress: number) => void,
): Promise<V12PiximiState> {
  // Implementation follows the same structure as the existing
  // v12_deserializeProject but:
  // 1. Uses RawTensorData instead of Tensor4D
  // 2. Extracts raw Float32Array directly from Zarr (no tensor4d() call)
  // 3. Uses deserializeColorsRaw instead of deserializeRawColorsGroup
  // 4. Does NOT call createRenderedTensor or prepareChannels
  //    (that happens later in the service after all converters run)

  const rootGroup = await openGroup(store, store.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");

  const projectName = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(projectGroup, "imageChannels")) as
    | number
    | string;

  // --- Metadata ---
  onProgress(11);
  const metadataGroup = await getGroup(projectGroup, "metadata");
  const { metadata, metadataLookup } =
    await deserializeMetadataGroup(metadataGroup);
  onProgress(15);

  // --- Images ---
  const imagesGroup = await getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(
    imagesGroup,
    metadataLookup,
    onProgress,
  );
  onProgress(60);

  // --- Annotations ---
  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(
    annotationsGroup,
    onProgress,
  );

  onProgress(80);
  // --- Categories ---
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const catIds = (await getAttr(
    categoriesGroup,
    ZARR_CATEGORY_GROUP.CategoryId,
  )) as string[];
  const catColors = (await getAttr(
    categoriesGroup,
    ZARR_CATEGORY_GROUP.Color,
  )) as string[];
  const catNames = (await getAttr(
    categoriesGroup,
    ZARR_CATEGORY_GROUP.Name,
  )) as string[];
  const catKinds = (await getAttr(
    categoriesGroup,
    ZARR_CATEGORY_GROUP.Kind,
  )) as string[];
  const categories: V12Category[] = catIds.map((id, i) => ({
    id,
    color: catColors[i],
    name: catNames[i],
    kind: catKinds[i],
    visible: true,
  }));

  onProgress(82);
  // --- Kinds ---
  const kindsGroup = await getGroup(projectGroup, "kinds");
  const kindIds = (await getAttr(
    kindsGroup,
    ZARR_KIND_GROUP.KindId,
  )) as string[];
  const unknownCategoryIds = (await getAttr(
    kindsGroup,
    ZARR_KIND_GROUP.UnknownCategoryId,
  )) as string[];
  const displayNames = (await getAttr(
    kindsGroup,
    ZARR_KIND_GROUP.DisplayName,
  )) as string[];
  const kinds: V12Kind[] = kindIds.map((id, i) => ({
    id,
    displayName: displayNames[i],
    unknownCategoryId: unknownCategoryIds[i],
  }));

  onProgress(83);
  // --- Classifier & Segmenter ---
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v11_v12_deserializeClassifierGroup(classifierGroup);
  onProgress(95);
  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  // Build relationships from the data
  const relationships = buildRelationships(
    kinds,
    categories,
    images,
    annotations,
    metadata,
  );

  return {
    project: {
      ...initialProjectState,
      name: projectName,
      imageChannels: imageChannels === "undefined" ? undefined : +imageChannels,
    },
    classifier,
    segmenter,
    data: { kinds, categories, metadata, images, annotations, relationships },
  };
}

const deserializeMetadataGroup = async (
  metadataGroup: Group,
): Promise<{
  metadata: V12ImageMetadata[];
  metadataLookup: Record<string, { shape: Shape; bitDepth: BitDepth }>;
}> => {
  const metadataNames = (await getAttr(
    metadataGroup,
    ZARR_METADATA_GROUP.MetadataNames,
  )) as string[];
  const metadata: V12ImageMetadata[] = [];
  const metadataLookup: Record<string, { shape: Shape; bitDepth: BitDepth }> =
    {};

  for (const name of metadataNames) {
    const g = await getGroup(metadataGroup, name);
    const id = (await getAttr(g, ZARR_METADATA_GROUP.Id)) as string;
    const imageDataIds = (await getAttr(
      g,
      ZARR_METADATA_GROUP.ImageDataIds,
    )) as string[];
    const kind = (await getAttr(g, ZARR_METADATA_GROUP.Kinds)) as string;
    const planes = (await getAttr(g, ZARR_METADATA_GROUP.Planes)) as number;
    const channels = (await getAttr(g, ZARR_METADATA_GROUP.Channels)) as number;
    const width = (await getAttr(g, ZARR_METADATA_GROUP.Width)) as number;
    const height = (await getAttr(g, ZARR_METADATA_GROUP.Height)) as number;
    const bitDepth = (await getAttr(
      g,
      ZARR_METADATA_GROUP.BitDepth,
    )) as BitDepth;
    const defaultImageId = (await getAttr(
      g,
      ZARR_METADATA_GROUP.DefaultImageId,
    )) as string;
    const timeSeries = (await getAttr(
      g,
      ZARR_METADATA_GROUP.TimeSeries,
    )) as boolean;
    const shape = { planes, channels, width, height };

    metadata.push({
      id,
      name,
      kind,
      bitDepth,
      shape,
      timeSeries,
      imageDataIds,
      defaultImageId,
    });
    metadataLookup[id] = { shape, bitDepth };
  }

  return { metadata, metadataLookup };
};

const deserializeImagesGroup = async (
  imagesGroup: Group,
  metadataLookup: Record<
    string,
    {
      shape: Shape;
      bitDepth: BitDepth;
    }
  >,
  onProgress: (progress: number) => void,
): Promise<V12RawImageObject[]> => {
  const imageNames = (await getAttr(
    imagesGroup,
    ZARR_IMAGE_GROUP.ImageNames,
  )) as string[];
  const images: V12RawImageObject[] = [];

  for (const [i, name] of Object.entries(imageNames)) {
    const g = await getGroup(imagesGroup, name);
    const id = (await getAttr(g, ZARR_IMAGE_GROUP.Id)) as string;
    const partition = (await getAttr(
      g,
      ZARR_IMAGE_GROUP.ClassifierPartition,
    )) as Partition;
    const timepoint = (await getAttr(g, ZARR_IMAGE_GROUP.Timepoint)) as number;
    const categoryId = (await getAttr(
      g,
      ZARR_IMAGE_GROUP.ClassCategoryId,
    )) as string;
    const activePlane = (await getAttr(
      g,
      ZARR_IMAGE_GROUP.ActivePlane,
    )) as number;
    const metadataId = (await getAttr(
      g,
      ZARR_IMAGE_GROUP.MetadataId,
    )) as string;

    // Read raw array — NO tensor4d() call
    const dataset = await getDataset(g, name);
    const rawArray = (await dataset.getRaw()) as RawArray;
    const { shape } = metadataLookup[metadataId];
    const tensorShape: [number, number, number, number] = [
      shape.planes,
      shape.height,
      shape.width,
      shape.channels,
    ];

    // Colors as plain arrays
    const colorsGroup = await getGroup(g, "colors");
    const colors = await deserializeColorsRaw(colorsGroup);

    images.push({
      id,
      name,
      metadataId,
      colors,
      categoryId,
      activePlane,
      partition,
      timepoint,
      tensorData: {
        buffer: (rawArray.data as Float32Array).buffer as ArrayBuffer,
        dtype: "float32",
        shape: tensorShape,
      },
    });
    onProgress(15 + Math.floor((+i / imageNames.length) * 45));
  }

  return images;
};
const deserializeAnnotationsGroup = async (
  annotationsGroup: Group,
  onProgress: (progress: number) => void,
): Promise<V12RawAnnotationObject[]> => {
  const annotationNames = (await getAttr(
    annotationsGroup,
    ZARR_ANNOTATION_GROUP.AnnotationNames,
  )) as string[];
  const annotations: V12RawAnnotationObject[] = [];

  for (const [i, name] of Object.entries(annotationNames)) {
    const g = await getGroup(annotationsGroup, name);
    const id = (await getAttr(g, ZARR_ANNOTATION_GROUP.Id)) as string;
    const activePlane = (await getAttr(
      g,
      ZARR_ANNOTATION_GROUP.ActivePlane,
    )) as number;
    const categoryId = (await getAttr(
      g,
      ZARR_ANNOTATION_GROUP.ClassCategoryId,
    )) as string;
    const partition = (await getAttr(
      g,
      ZARR_ANNOTATION_GROUP.ClassifierPartition,
    )) as Partition;
    const kind = (await getAttr(g, ZARR_ANNOTATION_GROUP.Kind)) as string;
    const timepoint = (await getAttr(
      g,
      ZARR_ANNOTATION_GROUP.Timepoint,
    )) as number;

    const dataset = await getDataset(g, name);
    const rawArray = (await dataset.getRaw()) as RawArray;
    const [planes, height, width, channels] = rawArray.shape;
    const bitDepth = (await getAttr(dataset, "bit_depth")) as BitDepth;

    const boundingBox = (await getAttr(g, ZARR_ANNOTATION_GROUP.Bbox)) as [
      number,
      number,
      number,
      number,
    ];
    const encodedMask = (await getAttr(
      g,
      ZARR_ANNOTATION_GROUP.Mask,
    )) as number[];
    const imageId = (await getAttr(g, ZARR_ANNOTATION_GROUP.ImageId)) as string;

    annotations.push({
      id,
      name,
      kind,
      bitDepth,
      partition,
      boundingBox,
      encodedMask,
      plane: activePlane,
      imageId,
      timepoint,
      categoryId,
      activePlane,
      shape: { planes, height, width, channels },
      tensorData: {
        buffer: (rawArray.data as Float32Array).buffer as ArrayBuffer,
        dtype: "float32",
        shape: [planes, height, width, channels],
      },
    });
    onProgress(60 + Math.floor((+i / annotationNames.length) * 20));
  }

  return annotations;
};
function buildRelationships(
  kinds: V12Kind[],
  categories: V12Category[],
  images: V12RawImageObject[],
  annotations: V12RawAnnotationObject[],
  metadata: V12ImageMetadata[],
): V12PiximiState["data"]["relationships"] {
  // generateDataRelationships expects V12Kind, V12Category, V12ImageData,
  // V12AnnotationObject, string[] — our raw types are structurally compatible
  // for the fields it accesses (id, kind, categoryId, imageId).
  const relationships = generateDataRelationships(
    kinds as any,
    categories as any,
    images as any,
    annotations as any,
    metadata.map((m) => m.id),
  );
  return relationships;
}
